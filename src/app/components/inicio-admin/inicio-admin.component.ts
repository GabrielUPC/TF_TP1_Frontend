import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inicio-admin',
  imports: [RouterLink],
  templateUrl: './inicio-admin.component.html',
  styleUrl: './inicio-admin.component.css'
})
export class InicioAdminComponent {
  constructor(public authService: AuthService) {}
}
