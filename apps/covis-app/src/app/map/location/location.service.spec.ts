import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { DiseasePhase } from '@covis/shared';
import { LngLat } from 'maplibre-gl';
import { map } from 'rxjs';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(LocationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get hour range', () => {
    const expected = { min: 0, max: 1999 };

    service.getHourRange().subscribe((range) => {
      expect(range).toEqual(expected);
    });

    const req = httpTestingController.expectOne('/api/location/hour-range');
    req.flush(expected);

    expect(req.request.method).toEqual('GET');
  });

  it(
    'should get points for area',
    waitForAsync(() => {
      const expected = [
        {
          hour: 1,
          personId: 1,
          diseasePhase: DiseasePhase.healthy,
          location: { type: 'point', coordinates: [1, 2, 3] },
        },
        {
          hour: 1,
          personId: 2,
          diseasePhase: DiseasePhase.healthy,
          location: { type: 'point', coordinates: [1, 2, 3] },
        },
        {
          hour: 1,
          personId: 3,
          diseasePhase: DiseasePhase.healthy,
          location: { type: 'point', coordinates: [1, 2, 3] },
        },
      ];

      const flush = <T>(expected: T) => {
        const request = httpTestingController.expectOne((request) =>
          request.url.startsWith('/api/location')
        );
        request.flush(expected);
      };

      service
        .getAllForArea({
          hour: 0,
          ne: new LngLat(1, 1),
          sw: new LngLat(1, 1),
          zoom: 1,
        })
        .pipe(
          map((range, index) => {
            if (index === 0) {
              expect(range).toEqual(expected);
              setTimeout(() => flush([]));
            } else if (index === 1) {
              expect(range).toEqual([]);
            }
          })
        )
        .subscribe();

      flush(expected);
    })
  );
});
