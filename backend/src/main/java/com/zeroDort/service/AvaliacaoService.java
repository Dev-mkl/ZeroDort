package com.zeroDort.service;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.dto.AvaliacaoResponse;
import com.zeroDort.dto.PerguntaItem;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Corpo;
import com.zeroDort.model.Estudioso;
import com.zeroDort.model.PerguntaCorpo;
import com.zeroDort.model.Resposta;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.PerguntaCorpoRepository;
import com.zeroDort.repository.RespostaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

@Service
public class AvaliacaoService {

    private static final double MULTIPLICADOR_SYN_01 = 1.25;
    private static final double MULTIPLICADOR_SYN_02 = 1.20;
    private static final double MULTIPLICADOR_SYN_03 = 1.30;
    private static final double MULTIPLICADOR_SYN_04 = 1.15;
    private static final double MULTIPLICADOR_SYN_06 = 1.20;

    private static final Set<String> PERGUNTAS_EQUIPAMENTO_MOBILIARIO = Set.of(
            "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11"
    );

    @Autowired private EstudiosoService estudiosoService;
    @Autowired private ChaveAcessoService chaveAcessoService;
    @Autowired private UsuarioService usuarioService;
    @Autowired private ModeloService modeloService;
    @Autowired private RespostaRepository respostaRepository;
    @Autowired private PerguntaCorpoRepository perguntaCorpoRepository;

    @Transactional
    public AvaliacaoResponse cadastrarAvaliacao(AvaliacaoRequest avaliacaoRequest) {
        Estudioso estudioso = estudiosoService.buscarEstudioso(avaliacaoRequest.estudiosoId());
        if (avaliacaoRequest.perguntas() == null || avaliacaoRequest.perguntas().isEmpty()) {
            throw new IllegalArgumentException("A avaliação precisa conter ao menos uma resposta.");
        }

        Map<String, List<String>> respostasPorPergunta = new HashMap<>();
        Map<Short, Double> pontuacoesBrutasPorCorpo = new HashMap<>();
        Map<Short, Corpo> regioesAvaliadas = new HashMap<>();
        Map<String, Double> pontuacoesPorPergunta = new HashMap<>();
        Set<String> respostasEnviadas = new HashSet<>();
        double pontuacaoBrutaTotal = 0;

        for (PerguntaItem item : avaliacaoRequest.perguntas()) {
            String codigoPergunta = normalizarCodigo(item.CodigoPergunta());
            if (codigoPergunta.isBlank()) {
                throw new IllegalArgumentException("O código da pergunta é obrigatório.");
            }

            Short respostaId = converterRespostaId(item.RespostaId());
            if (!respostasEnviadas.add(codigoPergunta + ":" + respostaId)) {
                throw new IllegalArgumentException(
                        "A resposta " + respostaId + " foi enviada mais de uma vez para " + codigoPergunta + "."
                );
            }

            Resposta resposta = respostaRepository
                    .findByRespostaIdAndPergunta_Codigo(respostaId, codigoPergunta)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Resposta " + respostaId + " não encontrada para a pergunta " + codigoPergunta
                    ));

            double pontuacao = resposta.getPontuacao();
            validarPontuacao(pontuacao);
            String codigoResposta = normalizarCodigo(resposta.getResposta());
            List<String> respostasDaPergunta = respostasPorPergunta.computeIfAbsent(
                    codigoPergunta,
                    ignored -> new ArrayList<>()
            );
            if (!respostasDaPergunta.isEmpty() && !"P13".equals(codigoPergunta)) {
                throw new IllegalArgumentException(
                        "A pergunta " + codigoPergunta + " aceita somente uma resposta."
                );
            }
            respostasDaPergunta.add(codigoResposta);
            pontuacoesPorPergunta.merge(codigoPergunta, pontuacao, Double::sum);
            pontuacaoBrutaTotal += pontuacao;

            List<PerguntaCorpo> regioesAfetadas = perguntaCorpoRepository
                    .findAllByPergunta_PerguntaId(resposta.getPergunta().getPerguntaId());
            for (PerguntaCorpo perguntaCorpo : regioesAfetadas) {
                Corpo corpo = perguntaCorpo.getCorpo();
                regioesAvaliadas.put(corpo.getId(), corpo);
                pontuacoesBrutasPorCorpo.merge(corpo.getId(), pontuacao, Double::sum);
            }
        }

        List<SinergiaAtivada> sinergias = avaliarSinergias(respostasPorPergunta, pontuacoesPorPergunta);
        double bonusTotal = sinergias.stream().mapToDouble(SinergiaAtivada::bonus).sum();
        double multiplicadorGlobal = sinergias.stream()
                .mapToDouble(SinergiaAtivada::multiplicadorGlobal)
                .reduce(1.0, (total, multiplicador) -> total * multiplicador);

        double pontuacaoCalculada = (pontuacaoBrutaTotal + bonusTotal) * multiplicadorGlobal;
        validarPontuacao(pontuacaoCalculada);
        double scoreGlobal = Math.floor(Math.min(100, pontuacaoCalculada));
        if (sinergias.stream().anyMatch(SinergiaAtivada::travaCritica)) {
            scoreGlobal = Math.max(81, scoreGlobal);
        }

        Map<Short, Double> pontuacoesPorRegiao = calcularPontuacoesPorRegiao(
                pontuacoesBrutasPorCorpo,
                regioesAvaliadas,
                sinergias
        );

        ChaveAcesso chaveAcesso = chaveAcessoService.gerarChaveAcesso();
        Usuario usuario = usuarioService.cadastrarUsuario(estudioso, chaveAcesso, scoreGlobal);
        if (usuario.getId() != null) {
            chaveAcessoService.marcarChaveUtilizada(usuario.getChaveAcesso().getId());
        }

        Short posicao = usuarioService.buscarPosicao(usuario);
        modeloService.cadastrarModelo(usuario, pontuacoesPorRegiao);

        return new AvaliacaoResponse(
                estudioso.getId(),
                usuario.getChaveAcesso().getCodigo(),
                scoreGlobal,
                posicao
        );
    }

    private List<SinergiaAtivada> avaliarSinergias(
            Map<String, List<String>> respostas,
            Map<String, Double> pontuacoesPorPergunta
    ) {
        List<SinergiaAtivada> sinergias = new ArrayList<>();

        if (respostaCorresponde(respostas, "P6", texto ->
                texto.contains("NOTEBOOK_DIRETO") || texto.contains("SEM_SUPORTE"))
                && respostaCorresponde(respostas, "P7", texto ->
                texto.contains("MUITO_ABAIXO") || texto.contains("FLEXAO_CONSTANTE"))) {
            sinergias.add(new SinergiaAtivada(10, 1, false,
                    List.of("cervical"), MULTIPLICADOR_SYN_01));
        }

        if (respostaCorresponde(respostas, "P2", texto ->
                texto.contains("SEM_AJUSTE_LOMBAR") || texto.contains("SEM_REGULAG")
                        || texto.contains("FIXA_E_SEM_REGULAG"))
                && respostaCorresponde(respostas, "P3", texto ->
                texto.contains("PES_SUSPENS") || texto.contains("BALANC")
                        || texto.contains("SEM_APOIO") || texto.contains("PERNAS_CRUZADAS"))) {
            sinergias.add(new SinergiaAtivada(8, 1, false,
                    List.of("lombar", "membros_inferiores"), MULTIPLICADOR_SYN_02));
        }

        if (respostaCorresponde(respostas, "P8", texto ->
                texto.contains("ORELHA_E_O_OMBRO") || texto.contains("ORELHA_E_OMBRO")
                        || texto.contains("PRESO_ENTRE"))
                && respostaCorresponde(respostas, "P9", texto ->
                texto.contains("PUNHOS_FORCADOS") || texto.contains("PUNHOS_FORCAD")
                        || texto.contains("BRACOS_ESTICADOS") || texto.contains("DORSIFLEXAO"))) {
            sinergias.add(new SinergiaAtivada(12, 1, false,
                    List.of("ombros", "punhos"), MULTIPLICADOR_SYN_03));
        }

        boolean sentado = respostaCorresponde(respostas, "P1", texto ->
                texto.contains("SENTADO_NA_MAIOR_PARTE") || texto.equals("SENTADO"));
        boolean posturaEmPe = respostaCorresponde(respostas, "P1", texto ->
                texto.contains("EM_PE_FIXO") || texto.contains("ALTERNANDO"));
        boolean trabalhoSemPausas = respostaCorresponde(respostas, "P12", this::respostaSemPausas);

        if (sentado && trabalhoSemPausas) {
            sinergias.add(new SinergiaAtivada(0, MULTIPLICADOR_SYN_04, false, List.of(), 1));
        }

        boolean sintomasCriticos = respostaCorresponde(respostas, "P13", this::sintomaEmPunhosOuCervical);
        double pontuacaoEquipamento = pontuacoesPorPergunta.entrySet().stream()
                .filter(entry -> PERGUNTAS_EQUIPAMENTO_MOBILIARIO.contains(entry.getKey()))
                .mapToDouble(Map.Entry::getValue)
                .sum();
        if (sintomasCriticos && pontuacaoEquipamento > 25) {
            sinergias.add(new SinergiaAtivada(0, 1, true, List.of(), 1));
        }

        boolean alcanceCriticoEmPe = respostaCorresponde(respostas, "P11", texto ->
                texto.contains("PRECISO_ME_CURVAR") || texto.contains("ACIMA_DOS_OMBROS")
                        || texto.contains("FLEXAO_EXCESSIVA") || texto.contains("ALCANCE_MANUAL_FORCADO"));
        if (posturaEmPe && alcanceCriticoEmPe) {
            sinergias.add(new SinergiaAtivada(10, 1, false,
                    List.of("ombros", "lombar"), MULTIPLICADOR_SYN_06));
        }

        return sinergias;
    }

    private Map<Short, Double> calcularPontuacoesPorRegiao(
            Map<Short, Double> pontuacoesBrutasPorCorpo,
            Map<Short, Corpo> regioesAvaliadas,
            List<SinergiaAtivada> sinergias
    ) {
        Map<Short, Double> pontuacoes = new HashMap<>(pontuacoesBrutasPorCorpo);
        Map<Short, Double> multiplicadoresPorCorpo = new HashMap<>();

        for (SinergiaAtivada sinergia : sinergias) {
            if (sinergia.regioesAlvo().isEmpty()) {
                continue;
            }

            List<Short> corposAlvo = regioesAvaliadas.entrySet().stream()
                    .filter(entry -> sinergia.regioesAlvo().stream()
                            .anyMatch(regiao -> pertenceARegiao(entry.getValue(), regiao)))
                    .map(Map.Entry::getKey)
                    .toList();
            if (corposAlvo.isEmpty()) {
                continue;
            }

            double bonusPorRegiao = sinergia.bonus() / corposAlvo.size();
            for (Short corpoId : corposAlvo) {
                pontuacoes.merge(corpoId, bonusPorRegiao, Double::sum);
                multiplicadoresPorCorpo.merge(
                        corpoId,
                        sinergia.multiplicadorRegional(),
                        (atual, novo) -> atual * novo
                );
            }
        }

        pontuacoes.replaceAll((corpoId, pontuacao) -> {
            double pontuacaoPonderada = pontuacao * multiplicadoresPorCorpo.getOrDefault(corpoId, 1.0);
            validarPontuacao(pontuacaoPonderada);
            return Math.min(100, pontuacaoPonderada);
        });
        return pontuacoes;
    }

    private boolean pertenceARegiao(Corpo corpo, String regiaoAlvo) {
        String nome = normalizarCodigo(corpo.getNome());
        return switch (regiaoAlvo) {
            case "cervical" -> nome.contains("CERVICAL") || nome.contains("PESCOCO");
            case "lombar" -> nome.contains("LOMBAR");
            case "ombros" -> nome.contains("OMBRO") || nome.contains("TRAPEZIO");
            case "punhos" -> nome.contains("PUNHO") || nome.contains("MAO");
            case "membros_inferiores" -> nome.contains("PERN") || nome.contains("PES")
                    || nome.contains("COXA") || nome.contains("TORNOZELO");
            default -> false;
        };
    }

    private boolean respostaCorresponde(
            Map<String, List<String>> respostas,
            String codigoPergunta,
            Predicate<String> criterio
    ) {
        return respostas.getOrDefault(codigoPergunta, List.of()).stream().anyMatch(criterio);
    }

    private boolean respostaSemPausas(String resposta) {
        return resposta.contains("HORAS_SEGUIDAS_SEM_LEVANTAR")
                || resposta.contains("HORAS_SEGUIDAS")
                || resposta.equals("SEMPRE_SEGUIDO");
    }

    private boolean sintomaEmPunhosOuCervical(String resposta) {
        return resposta.contains("PUNHO") || resposta.contains("MAO")
                || resposta.contains("FORMIGAMENTO") || resposta.contains("DORMENCIA")
                || resposta.contains("PESCOCO") || resposta.contains("CERVICAL");
    }

    private Short converterRespostaId(String respostaId) {
        try {
            return Short.valueOf(respostaId);
        } catch (NumberFormatException | NullPointerException exception) {
            throw new IllegalArgumentException("Identificador de resposta inválido: " + respostaId, exception);
        }
    }

    private String normalizarCodigo(String valor) {
        if (valor == null) {
            return "";
        }
        String semAcentos = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcentos.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_|_$", "");
    }

    private void validarPontuacao(double pontuacao) {
        if (!Double.isFinite(pontuacao) || pontuacao < 0) {
            throw new IllegalArgumentException("A pontuação precisa ser um valor finito e não negativo.");
        }
    }

    private record SinergiaAtivada(
            double bonus,
            double multiplicadorGlobal,
            boolean travaCritica,
            List<String> regioesAlvo,
            double multiplicadorRegional
    ) {}
}
