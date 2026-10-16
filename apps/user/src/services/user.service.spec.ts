import { NotFoundException } from '@nestjs/common';
import UserService from './user.service';
import UserRepository from '../repository/user.repository';
import CityRepository from '../repository/city.repository';
import { City, User } from 'src/generated/prisma';

describe('UserService', () => {
  let userRepository: { updateName: jest.Mock; updateCity: jest.Mock };
  let cityRepository: { findBySlug: jest.Mock };
  let service: UserService;

  beforeEach(() => {
    userRepository = { updateName: jest.fn(), updateCity: jest.fn() };
    cityRepository = { findBySlug: jest.fn() };
    service = new UserService(
      userRepository as unknown as UserRepository,
      cityRepository as unknown as CityRepository,
    );
  });

  describe('updateCity', () => {
    const city = { id: 7, slug: 'riga', name: 'Riga' } as City;

    it('sets the city and returns the user with the city', async () => {
      const user = { uuid: 'uuid-1', cityId: 7 } as User;
      cityRepository.findBySlug.mockResolvedValue(city);
      userRepository.updateCity.mockResolvedValue(user);

      await expect(service.updateCity('uuid-1', 'riga')).resolves.toEqual({
        user,
        city,
      });
      expect(cityRepository.findBySlug).toHaveBeenCalledWith('riga');
      expect(userRepository.updateCity).toHaveBeenCalledWith('uuid-1', 7);
    });

    it('throws NotFoundException when the city does not exist', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.updateCity('uuid-1', 'atlantis')).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.updateCity).not.toHaveBeenCalled();
    });
  });

  describe('updateName', () => {
    it('returns the updated user', async () => {
      const user = { uuid: 'uuid-1', email: 'a@b.c', name: 'New' } as User;
      userRepository.updateName.mockResolvedValue(user);

      await expect(service.updateName('uuid-1', 'New')).resolves.toBe(user);
      expect(userRepository.updateName).toHaveBeenCalledWith('uuid-1', 'New');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.updateName.mockResolvedValue(null);

      await expect(service.updateName('missing', 'New')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
