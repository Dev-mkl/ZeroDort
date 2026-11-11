package com.zeroDort.service;

import com.zeroDort.dto.RankingResponse;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public boolean isNomeDisponivel(String nome) {
        return nome != null
                && !nome.isBlank()
                && nome.trim().length() <= 40
                && usuarioRepository.isNomeDisponivel(nome.trim());
    }

    public Usuario cadastrarUsuario(String nome, ChaveAcesso chaveAcesso, Double score) {
        String nomeNormalizado = nome == null ? "" : nome.trim();
        if (!isNomeDisponivel(nomeNormalizado)) {
            throw new IllegalArgumentException("Este nome de usuário já está em uso.");
        }
        Usuario usuario = Usuario.builder()
                .nome(nomeNormalizado)
                .chaveAcesso(chaveAcesso)
                .score(score)
                .build();
        return usuarioRepository.save(usuario);
    }

    public Short buscarPosicao(Usuario usuario) {
        Short posicao = usuarioRepository.countByScoreLessThan(usuario.getScore());
        posicao = (short) (posicao + 1);
        return posicao;
    }

    public List<RankingResponse> gerarRanking() {
        return usuarioRepository.findRanking();
    }
}
