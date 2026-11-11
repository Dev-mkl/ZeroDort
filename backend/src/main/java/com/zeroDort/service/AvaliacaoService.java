package com.zeroDort.service;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.dto.AvaliacaoResponse;
import com.zeroDort.dto.PerguntaItem;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Estudioso;
import com.zeroDort.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class AvaliacaoService {

    @Autowired private EstudiosoService estudiosoService;
    @Autowired private ChaveAcessoService chaveAcessoService;
    @Autowired private UsuarioService usuarioService;
    @Autowired private ModeloService modeloService;

    @Transactional // Garante que se der erro no final, nada é salvo pela metade
    public AvaliacaoResponse cadastrarAvaliacao(AvaliacaoRequest avaliacaoRequest) {
        Estudioso estudioso = estudiosoService.buscarEstudioso(avaliacaoRequest.estudiosoId());

        Short score = gerarScore(avaliacaoRequest.perguntas());
        List<ChaveAcesso> chavesDisponiveis = chaveAcessoService.buscarChaveAcessoDisponivel();

        if (chavesDisponiveis.isEmpty()) {
            throw new RuntimeException("Não há chaves de acesso disponíveis no sistema.");
        }

        ChaveAcesso chaveSorteada = chavesDisponiveis.get(new Random().nextInt(chavesDisponiveis.size()));

        Usuario usuario = usuarioService.cadastrarUsuario(estudioso, chaveSorteada, score);

        if (usuario.getId() != null) {
            chaveAcessoService.marcarChaveUtilizada(usuario.getChaveAcesso().getId());
        }

        Short posicao = usuarioService.buscarPosicao(usuario);

        modeloService.cadastrarModelo(usuario, avaliacaoRequest.perguntas());

        return new AvaliacaoResponse(
                usuario.getChaveAcesso().getCodigo(),
                score,
                posicao
        );
    }

    private Short gerarScore(List<PerguntaItem> perguntas) {
        Short soma = 0;
        for (PerguntaItem pergunta : perguntas) {
            soma = (short) (soma + pergunta.pontuacao());
        }
        return soma;
    }
}