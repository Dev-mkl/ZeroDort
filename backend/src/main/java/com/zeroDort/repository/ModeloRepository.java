package com.zeroDort.repository;

import com.zeroDort.model.Modelo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModeloRepository extends JpaRepository<Modelo, Short> {
    List<Modelo> findAllByUsuario_IdOrderByCorpo_Nome(Short usuarioId);
}