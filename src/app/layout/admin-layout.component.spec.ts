import { TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { provideRouter } from '@angular/router';

describe('AdminLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
