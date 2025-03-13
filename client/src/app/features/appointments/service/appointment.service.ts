// ...existing code...
  public loadAvailableSlots() {
    const doctorInfo = this.getCurrentDoctor();
    if (!doctorInfo || !doctorInfo.doctorId) {
      console.debug('No doctor selected yet, skipping available slots loading');
      this.availableSlotsSubject.next([]);
      return of([]); // Return empty observable
    }

    return this.http.get<AppointmentPatient[]>(`${this.apiUrl}/appointments/doctor/${doctorInfo.doctorId}/availability`).pipe(
      map(slots => slots.map(slot => ({
        ...slot,
        appointmentDate: new Date(slot.appointmentDate)
      }))),
      tap(slots => {
        this.availableSlotsSubject.next(slots);
      }),
      catchError(error => {
        console.error('Error loading available slots:', error);
        this.availableSlotsSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }
// ...existing code...