import { Routes } from '@angular/router';

import {HomeComponent} from "./componente/home-component/home-component";
import {AlimentoComponent} from "./componente/alimento-component/alimento-component";
import {LoginComponent} from './componente/login-component/login-component';
import {RegistrarUsuario} from './componente/registrar-usuario/registrar-usuario';
import {AlimentoNuevoComponent} from './componente/alimento-nuevo-component/alimento-nuevo-component';
import {PlatoComponent} from './componente/plato-component/plato-component';
import {PlatoNuevoEditComponent} from './componente/plato-nuevo-edit-component/plato-nuevo-edit-component';
import {InfoComponent} from './componente/info-component/info-component';
import {ElegirObjetivosComponent} from './componente/elegir-objetivos-component/elegir-objetivos-component';
import {DashboardComponent} from './componente/dashboard-component/dashboard-component';
import {NutricionistaComponent} from './componente/nutricionista-component/nutricionista-component';
import {NutricionistaInfoComponent} from './componente/nutricionista-info-component/nutricionista-info-component';
import {UsuarioComponent} from './componente/usuario-component/usuario-component';
import { UsuarioInfoComponent } from './componente/usuario-info-component/usuario-info-component';
import {ConfiguracionComponent} from './componente/configuracion-component/configuracion-component';
import { CitasProgramadasComponent } from './componente/citas-programadas-component/citas-programadas-component';

export const routes: Routes = [
  {path: 'Alimento', component: AlimentoComponent},
  {path: 'info', component: InfoComponent},
  {path: 'objetivos', component: ElegirObjetivosComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'actividad/:userId', component: InfoComponent},
  {path: 'nuevo-edit', component: PlatoNuevoEditComponent},
  {path: 'nuevo-edit/:id', component: PlatoNuevoEditComponent},
  {path: 'Plato', component: PlatoComponent},
  {path: 'registro', component: RegistrarUsuario},
  {path: 'login', component: LoginComponent},
  {path: 'NuevoAlimento', component: AlimentoNuevoComponent},
  {path: 'ListaNutricionista', component: NutricionistaComponent },
  {path: 'usuarios', component: UsuarioComponent},
  {path: 'nutricionista/:id', component: NutricionistaInfoComponent},
  { path: 'usuarioinfo/:id', component: UsuarioInfoComponent },
  { path: 'config', component: ConfiguracionComponent },
  {path: 'citas-programadas', component: CitasProgramadasComponent},
  {path: 'home', component: HomeComponent},
  {path: '', component: HomeComponent, pathMatch: 'full'}

];
