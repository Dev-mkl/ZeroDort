package com.zeroDort.repository;

import com.zeroDort.dto.RankingResponse;
import com.zeroDort.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Short> {
    Short countByScoreLessThan(Double score);
    Optional<Usuario> findByChaveAcesso_Codigo(String codigo);

    @Query(value = """
            SELECT NOT EXISTS (
                SELECT 1
                FROM usuario
                WHERE lower(btrim(nome)) = lower(btrim(:nome))
            )
            """, nativeQuery = true)
    boolean isNomeDisponivel(@Param("nome") String nome);

    @Query("SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS posicao, u.nome AS nome, u.score AS score FROM Usuario u GROUP BY u.nome, u.score ORDER BY score ASC")
    List<RankingResponse> findRanking();
}
