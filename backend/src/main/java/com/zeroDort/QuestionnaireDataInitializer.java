package com.zeroDort;

import com.zeroDort.model.Corpo;
import com.zeroDort.model.Pergunta;
import com.zeroDort.model.PerguntaCorpo;
import com.zeroDort.model.Resposta;
import com.zeroDort.model.RespostaCorpo;
import com.zeroDort.repository.CorpoRepository;
import com.zeroDort.repository.PerguntaCorpoRepository;
import com.zeroDort.repository.PerguntaRepository;
import com.zeroDort.repository.RespostaCorpoRepository;
import com.zeroDort.repository.RespostaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class QuestionnaireDataInitializer implements CommandLineRunner {

    private static final List<QuestionSeed> QUESTIONS = List.of(
            question("P1", "Qual é a sua principal postura predominante de trabalho ao longo do dia?",
                    answer("Sentado na maior parte do tempo", 0),
                    answer("Em pé fixo na maior parte do tempo", 0),
                    answer("Alternando entre sentado e em pé", 0)),
            question("P2", "A sua cadeira ou banco possui ajuste de altura e apoio adequado para a região lombar / costas?",
                    answer("Sim, ambos reguláveis e funcionais", 0, "Lombar"),
                    answer("Apenas altura, sem ajuste lombar adequado", 5, "Lombar"),
                    answer("Não sei / Fixa e sem regulagens", 10, "Lombar")),
            question("P3", "Você utiliza apoio para os pés para garantir que eles fiquem totalmente apoiados?",
                    answer("Sim, meus pés alcançam o piso perfeitamente / Uso apoio regulável", 0, "Pés"),
                    answer("Não, meus pés ficam suspensos ou balançando / pernas cruzadas", 5, "Pés"),
                    answer("Não utilizo / Não se aplica", 0)),
            question("P4", "O formato da sua superfície de trabalho (mesa/bancada) e o espaço livre permitem aproximação sem compressão de pernas e braços?",
                    answer("Sim, espaço livre adequado e bordas arredondadas", 0, "Cotovelos / Antebraços", "Punhos"),
                    answer("Não, a mesa/bancada tem quinas vivas, rebarbas ou falta espaço para os joelhos", 10,
                            "Cotovelos / Antebraços", "Punhos")),
            question("P5", "Você utiliza computador (desktop ou notebook) na sua rotina de trabalho?",
                    answer("Sim", 0),
                    answer("Não", 0)),
            question("P6", "Qual equipamento de informática principal você utiliza?",
                    answer("Monitor externo ou Notebook com suporte elevado + Teclado e Mouse separados", 0, "Cervical"),
                    answer("Notebook direto na mesa (sem suporte, tela baixa)", 20, "Cervical")),
            question("P7", "Onde o topo da sua tela (ou monitor) está posicionado em relação aos seus olhos?",
                    answer("Na altura dos olhos ou ligeiramente abaixo (olhar reto/levemente para baixo)", 0, "Cervical"),
                    answer("Muito abaixo, exigindo flexão constante do pescoço", 15, "Cervical")),
            question("P8", "Durante ligações, reuniões ou atendimento, como você gerencia suas chamadas de áudio?",
                    answer("Utilizo fone com microfone (headset) com as mãos livres", 0, "Cervical", "Ombros"),
                    answer("Seguro o telefone ou celular entre a orelha e o ombro", 10, "Cervical", "Ombros"),
                    answer("Não realizo atendimento telefônico / Não se aplica", 0)),
            question("P9", "O teclado e o mouse estão posicionados na mesma superfície, permitindo punhos neutros e cotovelos a 90°?",
                    answer("Sim, braços flexionados e punhos retos", 0, "Punhos", "Ombros"),
                    answer("Não, braços esticados ou punhos forçados (dorsiflexão)", 10, "Punhos", "Ombros")),
            question("P10", "Você utiliza dispositivos móveis (celular, tablet, coletores de dados ou leitores de código de barras) de forma frequente?",
                    answer("Sim, com o pescoço inclinado para baixo por longos períodos", 10, "Cervical", "Punhos"),
                    answer("Não / Pouco uso", 0, "Cervical", "Punhos")),
            question("P11", "Se você trabalha em pé ou em bancadas, os elementos de trabalho exigem flexão excessiva do tronco ou alcance manual forçado acima dos ombros?",
                    answer("Não, tudo está dentro do alcance fácil e sem curvar o tronco", 0, "Lombar", "Ombros"),
                    answer("Sim, preciso me curvar frequentemente ou esticar os braços acima dos ombros", 10, "Lombar", "Ombros")),
            question("P12", "Com que frequência você faz pequenas pausas para esticar o corpo, caminhar e mudar de postura?",
                    answer("A cada 50-60 minutos ou menos", 0, "Coluna / Corpo todo"),
                    answer("A cada 2 ou 3 horas", 5, "Coluna / Corpo todo"),
                    answer("Trabalho horas seguidas sem levantar", 10, "Coluna / Corpo todo")),
            question("P13", "Você sente dores persistentes, formigamento ou sensação de peso ao final do dia em alguma destas regiões?",
                    answer("Nenhuma dor significativa", 0),
                    answer("Pescoço", 5, "Cervical"),
                    answer("Ombros", 5, "Ombros"),
                    answer("Região Lombar", 5, "Lombar"),
                    answer("Punhos / Mãos (formigamento ou dormência)", 10, "Punhos"))
    );

    private final PerguntaRepository perguntaRepository;
    private final RespostaRepository respostaRepository;
    private final CorpoRepository corpoRepository;
    private final PerguntaCorpoRepository perguntaCorpoRepository;
    private final RespostaCorpoRepository respostaCorpoRepository;

    public QuestionnaireDataInitializer(
            PerguntaRepository perguntaRepository,
            RespostaRepository respostaRepository,
            CorpoRepository corpoRepository,
            PerguntaCorpoRepository perguntaCorpoRepository,
            RespostaCorpoRepository respostaCorpoRepository
    ) {
        this.perguntaRepository = perguntaRepository;
        this.respostaRepository = respostaRepository;
        this.corpoRepository = corpoRepository;
        this.perguntaCorpoRepository = perguntaCorpoRepository;
        this.respostaCorpoRepository = respostaCorpoRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (QuestionSeed seed : QUESTIONS) {
            Pergunta pergunta = perguntaRepository.findByCodigo(seed.code())
                    .orElseGet(() -> Pergunta.builder().codigo(seed.code()).build());
            pergunta.setEnunciado(seed.statement());
            Pergunta perguntaSalva = perguntaRepository.save(pergunta);

            Map<String, Corpo> bodies = new LinkedHashMap<>();
            for (AnswerSeed answerSeed : seed.answers()) {
                Resposta resposta = respostaRepository
                        .findFirstByPergunta_PerguntaIdAndRespostaIgnoreCase(
                                perguntaSalva.getPerguntaId(), answerSeed.text()
                        )
                        .orElseGet(() -> Resposta.builder()
                                .pergunta(perguntaSalva)
                                .resposta(answerSeed.text())
                                .build());
                resposta.setPergunta(perguntaSalva);
                resposta.setPontuacao(answerSeed.score());
                resposta = respostaRepository.save(resposta);

                for (String bodyName : answerSeed.bodies()) {
                    Corpo corpo = bodies.computeIfAbsent(bodyName, this::findOrCreateBody);
                    if (!respostaCorpoRepository.existsByResposta_RespostaIdAndCorpo_Id(
                            resposta.getRespostaId(), corpo.getId())) {
                        respostaCorpoRepository.save(RespostaCorpo.builder()
                                .resposta(resposta)
                                .corpo(corpo)
                                .build());
                    }
                }
            }

            for (String bodyName : seed.answers().stream()
                    .flatMap(answer -> answer.bodies().stream())
                    .distinct()
                    .toList()) {
                Corpo corpo = bodies.computeIfAbsent(bodyName, this::findOrCreateBody);
                if (!perguntaCorpoRepository.existsByPergunta_PerguntaIdAndCorpo_Id(
                        perguntaSalva.getPerguntaId(), corpo.getId())) {
                    perguntaCorpoRepository.save(PerguntaCorpo.builder()
                            .pergunta(perguntaSalva)
                            .corpo(corpo)
                            .build());
                }
            }
        }
    }

    private Corpo findOrCreateBody(String name) {
        return corpoRepository.findByNome(name)
                .orElseGet(() -> corpoRepository.save(Corpo.builder().nome(name).build()));
    }

    private static QuestionSeed question(String code, String statement, AnswerSeed... answers) {
        return new QuestionSeed(code, statement, List.of(answers));
    }

    private static AnswerSeed answer(String text, double score, String... bodies) {
        return new AnswerSeed(text, score, List.of(bodies));
    }

    private record QuestionSeed(String code, String statement, List<AnswerSeed> answers) {}

    private record AnswerSeed(String text, double score, List<String> bodies) {}
}
