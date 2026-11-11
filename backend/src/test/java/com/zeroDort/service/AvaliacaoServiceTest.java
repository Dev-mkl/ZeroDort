package com.zeroDort.service;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.dto.AvaliacaoResponse;
import com.zeroDort.dto.PerguntaItem;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Corpo;
import com.zeroDort.model.Estudioso;
import com.zeroDort.model.Pergunta;
import com.zeroDort.model.PerguntaCorpo;
import com.zeroDort.model.Resposta;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.PerguntaCorpoRepository;
import com.zeroDort.repository.RespostaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvaliacaoServiceTest {

    @Mock
    private EstudiosoService estudiosoService;
    @Mock
    private ChaveAcessoService chaveAcessoService;
    @Mock
    private UsuarioService usuarioService;
    @Mock
    private ModeloService modeloService;
    @Mock
    private RespostaRepository respostaRepository;
    @Mock
    private PerguntaCorpoRepository perguntaCorpoRepository;

    @InjectMocks
    private AvaliacaoService avaliacaoService;

    private Estudioso estudioso;
    private ChaveAcesso chave;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        estudioso = Estudioso.builder().id((short) 7).build();
        chave = ChaveAcesso.builder().id((short) 31).codigo("uuid-key").build();
        usuario = Usuario.builder().id((short) 41).chaveAcesso(chave).build();

        when(estudiosoService.buscarEstudioso((short) 7)).thenReturn(estudioso);
        when(chaveAcessoService.gerarChaveAcesso()).thenReturn(chave);
        when(usuarioService.cadastrarUsuario(any(), any(), anyDouble())).thenReturn(usuario);
        when(usuarioService.buscarPosicao(usuario)).thenReturn((short) 1);
    }

    @Test
    void shouldApplySyn01AndSyn04RegardlessOfSubmittedAnswerOrder() {
        Resultado resultado = avaliar(List.of(
                resposta("P12", "Trabalho horas seguidas sem levantar", 10, "Coluna / Corpo todo"),
                resposta("P7", "Muito abaixo, exigindo flexão constante do pescoço", 15, "Cervical"),
                resposta("P6", "Notebook direto na mesa (sem suporte, tela baixa)", 20, "Cervical"),
                resposta("P1", "Sentado na maior parte do tempo", 0)
        ));

        assertEquals(63, resultado.response().scoreGlobal());
        assertEquals(Map.of(
                resultado.corpos().get("Cervical").getId(), 56.25,
                resultado.corpos().get("Coluna / Corpo todo").getId(), 10.0
        ), capturarPontuacoes());
    }

    @Test
    void shouldApplySyn02BonusAndLumbarAndLegMultipliers() {
        Resultado resultado = avaliar(List.of(
                resposta("P3", "Não, meus pés ficam suspensos ou balançando / pernas cruzadas", 5, "Pés"),
                resposta("P2", "Não sei / Fixa e sem regulagens", 10, "Lombar")
        ));

        assertEquals(23, resultado.response().scoreGlobal());
        assertEquals(Map.of(
                resultado.corpos().get("Pés").getId(), 10.799999999999999,
                resultado.corpos().get("Lombar").getId(), 16.8
        ), capturarPontuacoes());
    }

    @Test
    void shouldApplySyn03BonusAndUpperLimbMultipliers() {
        Resultado resultado = avaliar(List.of(
                resposta("P9", "Não, braços esticados ou punhos forçados (dorsiflexão)", 10, "Punhos"),
                resposta("P8", "Seguro o telefone entre a orelha e o ombro", 10, "Ombros")
        ));

        assertEquals(32, resultado.response().scoreGlobal());
        assertEquals(Map.of(
                resultado.corpos().get("Punhos").getId(), 20.8,
                resultado.corpos().get("Ombros").getId(), 20.8
        ), capturarPontuacoes());
    }

    @Test
    void shouldApplySyn04GlobalMultiplierAndFloorTheFinalScore() {
        Resultado resultado = avaliar(List.of(
                resposta("P12", "Trabalho horas seguidas sem levantar", 10, "Coluna"),
                resposta("P1", "Sentado na maior parte do tempo", 0)
        ));

        assertEquals(11, resultado.response().scoreGlobal());
    }

    @Test
    void shouldApplySyn05CriticalFloorForSymptomsAndEquipmentScoreAboveThreshold() {
        Resultado resultado = avaliar(List.of(
                resposta("P13", "Punhos / mãos (formigamento ou dormência)", 10, "Punhos"),
                resposta("P7", "Muito abaixo, exigindo flexão constante do pescoço", 15, "Cervical"),
                resposta("P6", "Notebook direto na mesa (sem suporte, tela baixa)", 20, "Cervical")
        ));

        assertEquals(81, resultado.response().scoreGlobal());
    }

    @Test
    void shouldApplySyn06OnlyForStandingOrAlternatingPostureAndCriticalReach() {
        Resultado resultado = avaliar(List.of(
                resposta("P11", "Sim, preciso me curvar frequentemente ou esticar os braços acima dos ombros",
                        10, "Lombar", "Ombros"),
                resposta("P1", "Alternando entre sentado e em pé", 0)
        ));

        assertEquals(20, resultado.response().scoreGlobal());
        assertEquals(Map.of(
                resultado.corpos().get("Lombar").getId(), 18.0,
                resultado.corpos().get("Ombros").getId(), 18.0
        ), capturarPontuacoes());
    }

    @Test
    void shouldCombineAllCompatibleSynergiesFromResponsesSubmittedOutOfOrder() {
        Resultado resultado = avaliar(List.of(
                resposta("P13", "Pescoço / Ombros / Região Lombar", 5, "Cervical"),
                resposta("P12", "Trabalho horas seguidas sem levantar", 10, "Coluna"),
                resposta("P9", "Não, braços esticados ou punhos forçados (dorsiflexão)", 10, "Punhos"),
                resposta("P8", "Seguro o telefone entre a orelha e o ombro", 10, "Ombros"),
                resposta("P7", "Muito abaixo, exigindo flexão constante do pescoço", 15, "Cervical"),
                resposta("P6", "Notebook direto na mesa (sem suporte, tela baixa)", 20, "Cervical"),
                resposta("P3", "Não, meus pés ficam suspensos ou balançando", 5, "Pés"),
                resposta("P2", "Fixa e sem regulagens, sem ajuste lombar adequado", 10, "Lombar"),
                resposta("P1", "Sentado na maior parte do tempo", 0)
        ));

        assertEquals(100, resultado.response().scoreGlobal());
    }

    private Resultado avaliar(List<RespostaInput> respostas) {
        Map<String, Corpo> corposPorNome = new HashMap<>();
        List<PerguntaItem> itens = new ArrayList<>();
        short respostaId = 1;
        short perguntaId = 1;

        for (RespostaInput input : respostas) {
            Pergunta pergunta = Pergunta.builder().perguntaId(perguntaId).codigo(input.codigo()).build();
            Resposta resposta = Resposta.builder()
                    .respostaId(respostaId)
                    .resposta(input.texto())
                    .pergunta(pergunta)
                    .pontuacao(input.pontuacao())
                    .build();
            when(respostaRepository.findByRespostaIdAndPergunta_Codigo(respostaId, input.codigo()))
                    .thenReturn(Optional.of(resposta));

            List<PerguntaCorpo> relacoes = new ArrayList<>();
            for (String nomeCorpo : input.corpos()) {
                Corpo corpo = corposPorNome.computeIfAbsent(nomeCorpo, nome ->
                        Corpo.builder().id((short) (corposPorNome.size() + 1)).nome(nome).build()
                );
                relacoes.add(PerguntaCorpo.builder().pergunta(pergunta).corpo(corpo).build());
            }
            when(perguntaCorpoRepository.findAllByPergunta_PerguntaId(perguntaId)).thenReturn(relacoes);
            itens.add(new PerguntaItem(input.codigo(), Short.toString(respostaId), null));
            respostaId++;
            perguntaId++;
        }

        AvaliacaoResponse response = avaliacaoService.cadastrarAvaliacao(
                new AvaliacaoRequest((short) 7, itens)
        );
        return new Resultado(response, corposPorNome);
    }

    private RespostaInput resposta(String codigo, String texto, double pontuacao, String... corpos) {
        return new RespostaInput(codigo, texto, pontuacao, List.of(corpos));
    }

    private Map<Short, Double> capturarPontuacoes() {
        ArgumentCaptor<Map<Short, Double>> captor = ArgumentCaptor.forClass(Map.class);
        verify(modeloService).cadastrarModelo(org.mockito.ArgumentMatchers.eq(usuario), captor.capture());
        return captor.getValue();
    }

    private record RespostaInput(String codigo, String texto, double pontuacao, List<String> corpos) {}

    private record Resultado(AvaliacaoResponse response, Map<String, Corpo> corpos) {}
}
