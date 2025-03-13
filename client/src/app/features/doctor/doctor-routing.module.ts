import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AddMedicalRecordComponent } from './patient/components/add-medical-record/add-medical-record.component';
import { MedicalRecordListComponent } from './patient/components/medical-record-list/medical-record-list.component';
import { ViewPatientsComponent } from './patient/view Patients/view_patients.component';

@NgModule({
  imports: [RouterModule.forChild([
    {
      path: '',
      component: ViewPatientsComponent
    },
    {
      path: 'medical-record/list',
      component: MedicalRecordListComponent
    },
    {
      path: 'medical-record/add/:id',
      component: AddMedicalRecordComponent
    }
  ])],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
