import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type TenantRegistrationPayload = {
  name: string;
  ownerEmail: string;
  subdomain: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  portalUrl: string;
};

@Injectable({ providedIn: 'root' })
export class TenantRegistrationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/tenants';

  checkSubdomain(subdomain: string): Observable<boolean> {
    return this.http
      .get<{ available: boolean }>(`${this.baseUrl}/subdomain-availability`, {
        params: { subdomain },
      })
      .pipe(map((response) => response.available));
  }

  register(payload: TenantRegistrationPayload): Observable<TenantSummary> {
    return this.http.post<TenantSummary>(this.baseUrl, payload);
  }
}
