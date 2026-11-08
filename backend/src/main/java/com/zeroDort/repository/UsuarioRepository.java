package com.zeroDort.repository;

import com.zeroDort.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Short> {
    Short countByScoreLessThan(Short score);
}
