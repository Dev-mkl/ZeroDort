package com.zeroDort;

import com.zeroDort.model.Pergunta;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Corpo;
import com.zeroDort.model.Modelo;
import com.zeroDort.model.Resposta;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.CorpoRepository;
import com.zeroDort.repository.ChaveAcessoRepository;
import com.zeroDort.repository.ModeloRepository;
import com.zeroDort.repository.PerguntaCorpoRepository;
import com.zeroDort.repository.PerguntaRepository;
import com.zeroDort.repository.RespostaCorpoRepository;
import com.zeroDort.repository.RespostaRepository;
import com.zeroDort.repository.UsuarioRepository;
import com.zeroDort.service.RelatorioPdfService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BackendApplicationTests {

	@Autowired private MockMvc mockMvc;
	@Autowired private JdbcTemplate jdbcTemplate;
	@Autowired private UsuarioRepository usuarioRepository;
	@Autowired private ChaveAcessoRepository chaveAcessoRepository;
	@Autowired private ModeloRepository modeloRepository;
	@Autowired private RelatorioPdfService relatorioPdfService;
	@Autowired private PerguntaRepository perguntaRepository;
	@Autowired private RespostaRepository respostaRepository;
	@Autowired private CorpoRepository corpoRepository;
	@Autowired private PerguntaCorpoRepository perguntaCorpoRepository;
	@Autowired private RespostaCorpoRepository respostaCorpoRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void questionnaireAndBodyMappingsAreSeededInTheDatabase() {
		Map<String, Long> answerCounts = Map.ofEntries(
				Map.entry("P1", 3L), Map.entry("P2", 3L), Map.entry("P3", 3L),
				Map.entry("P4", 2L), Map.entry("P5", 2L), Map.entry("P6", 2L),
				Map.entry("P7", 2L), Map.entry("P8", 3L), Map.entry("P9", 2L),
				Map.entry("P10", 2L), Map.entry("P11", 2L), Map.entry("P12", 3L),
				Map.entry("P13", 5L)
		);
		for (Map.Entry<String, Long> expected : answerCounts.entrySet()) {
			Pergunta pergunta = perguntaRepository.findByCodigo(expected.getKey()).orElseThrow();
			assertEquals(expected.getValue(), respostaRepository.countByPergunta_PerguntaId(pergunta.getPerguntaId()));
		}

		assertTrue(Set.of(
				"Cervical", "Lombar", "Punhos", "Ombros", "Pés",
				"Coluna / Corpo todo", "Cotovelos / Antebraços"
		).stream().allMatch(nome -> corpoRepository.findByNome(nome).isPresent()));

		Pergunta pergunta13 = perguntaRepository.findByCodigo("P13").orElseThrow();
		Resposta pescoco = respostaRepository
				.findFirstByPergunta_PerguntaIdAndRespostaIgnoreCase(pergunta13.getPerguntaId(), "Pescoço")
				.orElseThrow();
		Set<String> regioesDoPescoco = respostaCorpoRepository
				.findAllByResposta_RespostaId(pescoco.getRespostaId())
				.stream()
				.map(relacao -> relacao.getCorpo().getNome())
				.collect(Collectors.toSet());
		assertEquals(Set.of("Cervical"), regioesDoPescoco);

		Set<String> regioesDaPergunta = perguntaCorpoRepository
				.findAllByPergunta_PerguntaId(pergunta13.getPerguntaId())
				.stream()
				.map(relacao -> relacao.getCorpo().getNome())
				.collect(Collectors.toSet());
		assertEquals(Set.of("Cervical", "Ombros", "Lombar", "Punhos"), regioesDaPergunta);
	}

	@Test
	void assessmentPreflightAllowsTheLocalFrontendOrigin() throws Exception {
		mockMvc.perform(options("/avaliacao")
						.header("Origin", "http://localhost:5500")
						.header("Access-Control-Request-Method", "POST")
						.header("Access-Control-Request-Headers", "content-type"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5500"))
				.andExpect(header().string("Access-Control-Allow-Methods", org.hamcrest.Matchers.containsString("POST")));
	}

	@Test
	void usuarioSchemaStoresNameWithoutEstudiosoForeignKey() {
		assertEquals(1, jdbcTemplate.queryForObject("""
				SELECT count(*)
				FROM information_schema.columns
				WHERE table_schema = current_schema()
				  AND table_name = 'usuario'
				  AND column_name = 'nome'
				  AND is_nullable = 'NO'
				""", Integer.class));
		assertEquals(0, jdbcTemplate.queryForObject("""
				SELECT count(*)
				FROM information_schema.columns
				WHERE table_schema = current_schema()
				  AND table_name = 'usuario'
				  AND column_name = 'estudioso_id'
				""", Integer.class));
	}

	@Test
	void generatedPdfContainsParticipantScoresAndRecommendations() throws Exception {
		ChaveAcesso chave = chaveAcessoRepository.save(ChaveAcesso.builder()
				.codigo(java.util.UUID.randomUUID().toString())
				.utilizada(true)
				.build());
		Usuario usuario = usuarioRepository.save(Usuario.builder()
				.nome("Participante PDF")
				.chaveAcesso(chave)
				.score(35.0)
				.build());
		Corpo cervical = corpoRepository.findByNome("Cervical").orElseThrow();
		modeloRepository.save(Modelo.builder()
				.usuario(usuario)
				.corpo(cervical)
				.pontuacao(22.5)
				.dataAvaliacao(LocalDateTime.now())
				.build());

		byte[] pdf = mockMvc.perform(get("/relatorios/{chave}/pdf", chave.getCodigo()))
				.andExpect(status().isOk())
				.andExpect(content().contentType("application/pdf"))
				.andExpect(header().string("Content-Disposition",
						org.hamcrest.Matchers.containsString("attachment")))
				.andReturn()
				.getResponse()
				.getContentAsByteArray();
		try (var document = Loader.loadPDF(pdf)) {
			String texto = new PDFTextStripper().getText(document);
			assertTrue(texto.contains("Participante PDF"));
			assertTrue(texto.contains("35 de 100"));
			assertTrue(texto.contains("Cervical: 22,50 pontos"));
			assertTrue(texto.contains("Revise os ajustes do posto"));
		}
		mockMvc.perform(get("/relatorios/chave-inexistente/pdf"))
				.andExpect(status().isNotFound());
	}

	@Test
	void usernameAvailabilityIgnoresCaseAndSurroundingSpaces() throws Exception {
		ChaveAcesso chave = chaveAcessoRepository.save(ChaveAcesso.builder()
				.codigo(java.util.UUID.randomUUID().toString())
				.utilizada(true)
				.build());
		usuarioRepository.save(Usuario.builder()
				.nome("Nome Exclusivo")
				.chaveAcesso(chave)
				.score(10.0)
				.build());

		mockMvc.perform(get("/usuarios/disponibilidade").param("nome", "  nOmE eXcLuSiVo  "))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"disponivel\":false}"));
		mockMvc.perform(get("/usuarios/disponibilidade").param("nome", "Outro Nome"))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"disponivel\":true}"));
	}
}
