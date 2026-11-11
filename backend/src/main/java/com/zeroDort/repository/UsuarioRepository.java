package com.zeroDort.repository;

import com.zeroDort.dto.RankingResponse;
import com.zeroDort.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UsuarioRepository extends JpaRepository<Usuario, Short> {
    Short countByScoreLessThan(Double score);

    @Query("SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS posicao, u.estudioso.nome AS nome, u.score AS score FROM Usuario u GROUP BY u.estudioso.nome, u.score ORDER BY score ASC")
    List<RankingResponse> findRanking();
}
