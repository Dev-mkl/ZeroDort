package com.zeroDort.repository;


import com.zeroDort.model.Estudioso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstudiosoRepository extends JpaRepository<Estudioso, Long> {
    List<Estudioso> findAllByDisponivel(Boolean disponivel);
}
