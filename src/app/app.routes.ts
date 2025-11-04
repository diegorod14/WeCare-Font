import { Routes } from '@angular/router';

import {HomeComponent} from "./componente/home-component/home-component";
import {AlimentoComponent} from "./componente/alimento-component/alimento-component";
import {InicioSesion} from './componente/inicio-sesion/inicio-sesion';
import {RegistrarUsuario} from './componente/registrar-usuario/registrar-usuario';

export const routes: Routes = [
  {path: '', component: HomeComponent, pathMatch: 'full'},
  {path: 'Alimento', component: AlimentoComponent},
  {path: 'registro', component: RegistrarUsuario},
  {path: 'login', component: InicioSesion}
];
