import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { EMPTY, expand } from 'rxjs';

const batchSize = 10_000;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private readonly httpClient: HttpClient) {}

  public getAllForHour(hour: number) {
    const getRequest = (page = 0) =>
      this.httpClient.get<Location[]>(`/api/location/${hour}`, {
        params: {
          from: page * batchSize,
          take: batchSize,
        },
      });

    let page = 1;
    return getRequest().pipe(
      expand((response) => (response.length > 0 ? getRequest(page++) : EMPTY))
    );
  }
}
