import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success field, return as-is (might be error response)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data has pagination structure { data: [], meta: {} }, wrap it
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        // For arrays and objects, wrap in standard format
        return {
          success: true,
          data,
        };
      }),
    );
  }
}


