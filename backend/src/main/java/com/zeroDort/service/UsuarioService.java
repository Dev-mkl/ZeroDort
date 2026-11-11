package com.zeroDort.service;

import com.zeroDort.dto.RankingResponse;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Estudioso;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Usuario cadastrarUsuario(Estudioso estudioso, ChaveAcesso chaveAcesso, Short score) {
        Usuario usuario = Usuario.builder()
                .estudioso(estudioso)
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
