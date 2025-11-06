# ✅ Agregar endpoint findByUsername al Backend

## 📝 Tu frontend ahora usa `findByUsername` para el login

El login está configurado para usar:
```typescript
this.usuarioService.findByUsername(this.username)
```

Que llama a: `GET /api/usuario/username/{username}`

---

## 🔧 Código para agregar en tu Backend Spring Boot

### 1️⃣ En `UsuarioController.java`:

Agrega este método después de los que ya tienes:

```java
@GetMapping("/usuario/username/{username}")
public UsuarioDTO findByUsername(@PathVariable String username) {
    return usuarioService.findByUsername(username);
}
```

**Tu controller completo quedaría así:**

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true", exposedHeaders = "Authorization")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/usuario/{id}")
    public UsuarioDTO findById(@PathVariable Long id) { 
        return usuarioService.findById(id); 
    }
    
    @GetMapping("/usuarios")
    public List<UsuarioDTO> findAll() { 
        return usuarioService.findAll(); 
    }
    
    @PostMapping("/usuario")
    public UsuarioDTO save(@RequestBody UsuarioDTO usuarioDTO) { 
        return usuarioService.save(usuarioDTO); 
    }
    
    @PutMapping("/usuario")
    public UsuarioDTO update(@RequestBody UsuarioDTO usuarioDTO) { 
        return usuarioService.update(usuarioDTO);
    }
    
    @DeleteMapping("/usuario/{id}")
    public void borrar(@PathVariable Long id) { 
        usuarioService.borrar(id); 
    }
    
    // ⬇️ NUEVO ENDPOINT PARA LOGIN
    @GetMapping("/usuario/username/{username}")
    public UsuarioDTO findByUsername(@PathVariable String username) {
        return usuarioService.findByUsername(username);
    }
}
```

---

### 2️⃣ En `UsuarioService.java`:

Agrega este método:

```java
public UsuarioDTO findByUsername(String username) {
    Usuario usuario = usuarioRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado con username: " + username));
    return convertToDTO(usuario);
}
```

---

### 3️⃣ En `UsuarioRepository.java`:

Agrega este método (si no lo tienes):

```java
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    
    // ... otros métodos que ya tengas
}
```

---

## 🎯 Resumen de cambios:

| Archivo | Acción |
|---------|--------|
| `UsuarioController.java` | ✅ Agregar método `findByUsername` con `@GetMapping` |
| `UsuarioService.java` | ✅ Agregar método `findByUsername` |
| `UsuarioRepository.java` | ✅ Agregar método `findByUsername` (JPA lo implementa automáticamente) |

---

## 🚀 Después de agregar estos métodos:

1. **Reinicia tu backend Spring Boot**
2. **Refresca tu navegador** (F5)
3. **Prueba el login** con un username existente
4. ✅ **Debería funcionar correctamente**

---

## ✅ Lo que ya está listo en el frontend:

- ✅ Componente de login configurado
- ✅ Usa `findByUsername`
- ✅ Formulario pide "Usuario" y "Contraseña"
- ✅ Guarda sesión en localStorage
- ✅ Redirige a la página principal después del login
- ✅ Componente de registro funcionando

**Solo falta agregar el endpoint en el backend y ¡listo!** 🎉

