package com.zeroDort.service;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.dto.AvaliacaoResponse;
import com.zeroDort.dto.Perguntas;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Estudioso;
import com.zeroDort.service.ModeloService;
import com.zeroDort.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Random;

@Service
public class AvaliacaoService {

    @Autowired
    private EstudiosoService estudiosoService;
    @Autowired
    private ChaveAcessoService chaveAcessoService;
    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ModeloService modeloService;

    public AvaliacaoResponse cadastrarAvaliacao(AvaliacaoRequest avaliacaoRequest) {
        Estudioso estudioso = estudiosoService.buscarEstudioso(avaliacaoRequest.estudiosoId());

        Short score = gerarScore(avaliacaoRequest.perguntas());
        List<ChaveAcesso> chavesDisponiveis = chaveAcessoService.buscarChaveAcessoDisponivel();


        Usuario usuario = usuarioService.cadastrarUsuario(
                estudioso,
                chavesDisponiveis.get(new Random().nextInt(chavesDisponiveis.size())),
                score
        );

        if (usuario.getId() != null) {
            chaveAcessoService.marcarChaveUtilizada(usuario.getChaveAcesso().getId());
        }

        Short posicao = usuarioService.buscarPosicao(usuario);

//        fazer a logica do cadastro do modelo
        modeloService.cadastrarModelo(usuario, avaliacaoRequest.perguntas());

        return new AvaliacaoResponse(
                usuario.getChaveAcesso().getCodigo(),
                score,
                posicao
        );
    }
    private Short gerarScore(List<Perguntas> perguntas) {
        Short soma = 0;
        for (Perguntas pergunta : perguntas) {
            soma = (short) (soma + pergunta.pontuacao());
        }
        return soma;
    }
}
