import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DetailLevel, Location, MinMaxRange } from '@covis/shared';
import { LngLat } from 'maplibre-gl';
import { EMPTY, expand } from 'rxjs';

interface Area {
  hour: number;
  zoom: number;
  sw: LngLat;
  ne: LngLat;
  details?: DetailLevel;
}

const batchSize = 10_000;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get the all points in the given area and hour
   * @param area
   */
  public getAllForArea({ sw, ne, hour, zoom, details }: Area) {
    const getRequest = (page = 0) =>
      this.httpClient.get<Location[]>(
        `/api/location/${sw.lng}/${sw.lat}/${ne.lng}/${ne.lat}/${zoom}/${hour}`,
        {
          params: {
            from: page * batchSize,
            take: batchSize,
            details: details as number,
          },
        }
      );

    let page = 1;
    return getRequest().pipe(
      expand((response) => (response.length > 0 ? getRequest(page++) : EMPTY))
    );
  }

  /**
   * Get the min and max hour range
   */
  public getHourRange() {
    return this.httpClient.get<MinMaxRange>(`/api/location/hour-range`);
  }
}
