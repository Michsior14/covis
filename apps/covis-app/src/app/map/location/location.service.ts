import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { LngLat } from 'maplibre-gl';
import { EMPTY, expand } from 'rxjs';

interface Area {
  hour: number;
  zoom: number;
  sw: LngLat;
  ne: LngLat;
}

const batchSize = 10_000;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private readonly httpClient: HttpClient) {}

  public getAllForArea({ sw, ne, hour, zoom }: Area) {
    const getRequest = (page = 0) =>
      this.httpClient.get<Location[]>(
        `/api/location/${sw.lng}/${sw.lat}/${ne.lng}/${ne.lat}/${zoom}/${hour}`,
        {
          params: {
            from: page * batchSize,
            take: batchSize,
          },
        }
      );

    let page = 1;
    return getRequest().pipe(
      expand((response) => (response.length > 0 ? getRequest(page++) : EMPTY))
    );
  }
}
