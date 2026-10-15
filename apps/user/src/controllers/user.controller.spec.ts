import UserController from './user.controller';
import UserService from '../services/user.service';
import UserResponder from '../responders/user.responder';
import UserRepository from '../repository/user.repository';
import { JwtAuthGuardRequest } from '../guards/jwt-auth.guard';

describe('UserController', () => {
  let userService: { updateName: jest.Mock; updateCity: jest.Mock };
  let controller: UserController;

  beforeEach(() => {
    userService = { updateName: jest.fn(), updateCity: jest.fn() };
    controller = new UserController(
      userService as unknown as UserService,
      new UserResponder(),
      {} as UserRepository,
    );
  });

  describe('updateName', () => {
    it('updates the authenticated user and returns the profile', async () => {
      const user = {
        id: 1,
        uuid: 'uuid-1',
        email: 'a@b.c',
        name: 'New',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userService.updateName.mockResolvedValue(user);

      const req = { user: { sub: 'uuid-1' } } as JwtAuthGuardRequest;
      const result = await controller.updateName(req, { name: 'New' });

      expect(userService.updateName).toHaveBeenCalledWith('uuid-1', 'New');
      expect(result).toEqual({ uuid: 'uuid-1', email: 'a@b.c', name: 'New' });
    });
  });

  describe('updateCity', () => {
    it('updates the city of the authenticated user and returns the profile with the city', async () => {
      userService.updateCity.mockResolvedValue({
        user: { uuid: 'uuid-1', email: 'a@b.c', name: 'Ann', cityId: 7 },
        city: { id: 7, slug: 'riga', name: 'Riga', isActive: true },
      });

      const req = { user: { sub: 'uuid-1' } } as JwtAuthGuardRequest;
      const result = await controller.updateCity(req, { citySlug: 'riga' });

      expect(userService.updateCity).toHaveBeenCalledWith('uuid-1', 'riga');
      expect(result).toEqual({
        uuid: 'uuid-1',
        email: 'a@b.c',
        name: 'Ann',
        city: { slug: 'riga', name: 'Riga' },
      });
    });
  });
});
