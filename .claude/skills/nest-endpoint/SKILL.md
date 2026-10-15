---
name: nest-endpoint
description: Use when adding a new REST endpoint to a NestJS service.
---

# Adding an endpoint

1. **Contract.** If the response shape is new, add the type to `packages/shared/src/responses/`,
   export it from `index.ts`, and run `npm run build` in `packages/shared`. Reuse an existing type if it fits.
2. **DTO.** Create `src/dto/<name>.dto.ts` with `class-validator` decorators.
   Take limits from shared constants (`NAME_MIN_LENGTH`, `PASSWORD_MIN_LENGTH`) instead of hardcoding numbers.
3. **Service.** Put the business checks here and throw Nest exceptions explicitly
   (`NotFoundException`, `ConflictException`). This is the only place that decides on a 4xx.
4. **Controller.**
   - Add `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` to every route with a body.
   - For authenticated routes, add `@UseGuards(JwtAuthGuard)` and take the user from `req.user.sub`,
     never from a URL param or the body.
   - Declare static routes (`/me`) before parametric ones (`/:uuid`) with the same method.
   - Return through the responder, never a raw Prisma model.
5. **Module.** Register any new provider in `app.module.ts`.
6. **Tests.** Write `*.spec.ts` for the service and the controller. Construct the classes directly with jest mocks
   (no `Test.createTestingModule`). Check that Jest has a `moduleNameMapper` for `src/*`.
