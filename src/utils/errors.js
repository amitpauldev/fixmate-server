export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const objectId = (value, name) => {
  if (!value || !/^[a-f\d]{24}$/i.test(value)) {
    throw new AppError(`Invalid ${name}`, 400);
  }

  return value;
};
