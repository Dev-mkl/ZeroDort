package com.zeroDort.repository;

import com.zeroDort.model.ChaveAcesso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChaveAcessoRepository extends JpaRepository<ChaveAcesso, Short> {
    List<ChaveAcesso> findAllByUtilizada(boolean utilizada);
}
