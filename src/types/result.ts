export enum ErrorType {
  GenericError = 'GenericError',
}

export interface Error {
  type: ErrorType;
  message: string;
}

export type Result<T> = Ok<T> | Err;

export interface Ok<T> {
  readonly _tag: 'Ok';
  readonly value: T;
}

export interface Err {
  readonly _tag: 'Err';
  readonly error: Error;
}

export const ok = <T>(value: T): Ok<T> => ({
  _tag: 'Ok',
  value,
});

export const err = (type: ErrorType, message: string): Err => ({
  _tag: 'Err',
  error: { type, message },
});

export const Result = {
  isOk: <T>(result: Result<T>): result is Ok<T> => result._tag === 'Ok',

  isErr: <T>(result: Result<T>): result is Err => result._tag === 'Err',

  unwrap: <T>(result: Result<T>): T => {
    if (Result.isOk(result)) {
      return result.value;
    }
    throw result.error;
  },

  unwrapOr: <T>(result: Result<T>, defaultValue: T): T => (Result.isOk(result) ? result.value : defaultValue),

  map: <T, U>(result: Result<T>, fn: (value: T) => U): Result<U> =>
    Result.isOk(result) ? ok(fn(result.value)) : result,

  mapErr: <T>(result: Result<T>, fn: (error: Error) => Error): Result<T> => {
    if (Result.isErr(result)) {
      const newError = fn(result.error);
      return err(newError.type, newError.message);
    }
    return result;
  },

  andThen: <T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> =>
    Result.isOk(result) ? fn(result.value) : result,
};
