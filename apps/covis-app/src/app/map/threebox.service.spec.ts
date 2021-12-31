import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Map } from 'maplibre-gl';
import { ThreeboxService } from './threebox.service';

const threebox = {
  update: jest.fn(),
  dispose: jest.fn(),
};

jest.mock('maplibre-gl', () => ({
  Map: jest.fn(() => ({
    getCanvas: jest.fn(() => ({ getContext: jest.fn() })),
  })),
}));

jest.mock('threebox-plugin', () => ({
  Threebox: jest.fn(() => threebox),
}));

describe('ThreeboxService', () => {
  let service: ThreeboxService;
  let ngZone: NgZone;
  let map: Map;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ThreeboxService);
    ngZone = TestBed.inject(NgZone);
    map = new Map({
      container: 'canvas',
      style: 'mapbox://styles/mapbox/streets-v11',
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize threebox instance', () => {
    service.initialize(map);
    expect(service.threebox).toBeDefined();
  });

  it('should update outside angular', () => {
    const runOutsideAngular = jest.spyOn(ngZone, 'runOutsideAngular');

    service.initialize(map);
    service.update();

    expect(runOutsideAngular).toHaveBeenCalled();
    expect(threebox.update).toHaveBeenCalled();
  });

  it('should dispose threebox', () => {
    service.initialize(map);
    service.dispose();

    expect(threebox.dispose).toHaveBeenCalled();
  });
});
