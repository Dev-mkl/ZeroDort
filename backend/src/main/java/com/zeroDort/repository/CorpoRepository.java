package com.zeroDort.repository;

import com.zeroDort.model.Corpo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CorpoRepository extends JpaRepository<Corpo, Short> {
    Optional<Corpo> findByNome(String nome);
}