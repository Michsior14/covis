import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { VisualizationRepository } from '../visualization/visualization.repository';
import { LocationService } from './location.service';
import { RangeResolver } from './range.resolver';

describe('RangeResolver', () => {
  let resolver: RangeResolver;
  let repository: VisualizationRepository;
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RangeResolver, LocationService, VisualizationRepository],
    });
    resolver = TestBed.inject(RangeResolver);
    service = TestBed.inject(LocationService);
    repository = TestBed.inject(VisualizationRepository);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it(
    'should resolve hour range and set min max time',
    waitForAsync(() => {
      jest
        .spyOn(service, 'getHourRange')
        .mockReturnValue(of({ min: 0.5, max: 23.8 }));
      const setMinMaxTime = jest
        .spyOn(repository, 'setMinMaxTime')
        .mockImplementation(() => void 0);

      resolver
        .resolve()
        .subscribe(() => expect(setMinMaxTime).toBeCalledWith(0, 23));
    })
  );
});
