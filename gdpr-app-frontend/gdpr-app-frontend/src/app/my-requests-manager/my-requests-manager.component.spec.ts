import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyRequestsManagerComponent } from './my-requests-manager.component';

describe('MyRequestsManagerComponent', () => {
  let component: MyRequestsManagerComponent;
  let fixture: ComponentFixture<MyRequestsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyRequestsManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyRequestsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
