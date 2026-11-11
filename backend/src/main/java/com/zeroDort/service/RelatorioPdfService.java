package com.zeroDort.service;

import com.zeroDort.model.Modelo;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.ModeloRepository;
import com.zeroDort.repository.UsuarioRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class RelatorioPdfService {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
    private static final float MARGIN = 52;
    private static final float BOTTOM_MARGIN = 55;
    private static final float LINE_HEIGHT = 17;

    private final UsuarioRepository usuarioRepository;
    private final ModeloRepository modeloRepository;

    public RelatorioPdfService(UsuarioRepository usuarioRepository, ModeloRepository modeloRepository) {
        this.usuarioRepository = usuarioRepository;
        this.modeloRepository = modeloRepository;
    }

    @Transactional(readOnly = true)
    public byte[] gerar(String chaveAcesso) {
        Usuario usuario = usuarioRepository.findByChaveAcesso_Codigo(chaveAcesso)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliação não encontrada."));
        List<Modelo> modelos = modeloRepository.findAllByUsuario_IdOrderByCorpo_Nome(usuario.getId());

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Writer writer = new Writer(document);
            writer.heading("Relatório de risco ergonômico");
            writer.paragraph("Participante: " + safe(usuario.getNome()));
            writer.paragraph(String.format(Locale.forLanguageTag("pt-BR"),
                    "Score global: %.0f de 100 - %s", usuario.getScore(), faixa(usuario.getScore())));

            if (modelos.isEmpty()) {
                writer.paragraph("Não há pontuações regionais registradas para esta avaliação.");
            } else {
                writer.section("Pontuação por parte do corpo");
                for (Modelo modelo : modelos) {
                    writer.paragraph(String.format(Locale.forLanguageTag("pt-BR"), "%s: %.2f pontos",
                            safe(modelo.getCorpo().getNome()), modelo.getPontuacao()));
                }

                writer.section("Recomendações");
                for (Modelo modelo : modelos) {
                    writer.paragraph(safe(modelo.getCorpo().getNome()) + ": "
                            + recomendacao(modelo.getPontuacao()));
                }
            }

            java.time.LocalDateTime dataAvaliacao = modelos.stream()
                    .map(Modelo::getDataAvaliacao)
                    .filter(data -> data != null)
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(null);
            if (dataAvaliacao != null) {
                writer.section("Dados da avaliação");
                writer.paragraph("Data: " + DATE_FORMAT.format(dataAvaliacao));
                writer.paragraph("Chave de acesso: " + chaveAcesso);
            }

            writer.finish();
            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível gerar o PDF do relatório.", exception);
        }
    }

    private String faixa(double score) {
        if (score <= 20) return "Baixo";
        if (score <= 40) return "Moderado";
        if (score <= 60) return "Alto";
        if (score <= 80) return "Muito alto";
        return "Crítico";
    }

    private String recomendacao(double score) {
        if (score <= 0) return "Mantenha as boas práticas atuais.";
        if (score <= 20) return "Mantenha boas práticas e monitore a região.";
        if (score <= 40) return "Revise os ajustes do posto e da rotina que afetam esta região.";
        if (score <= 60) return "Priorize uma intervenção ergonômica para esta região.";
        return "Reavalie imediatamente a exposição e procure orientação ocupacional.";
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "Não informado" : value;
    }

    private static final class Writer {
        private final PDDocument document;
        private final PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private PDPage page;
        private PDPageContentStream stream;
        private float y;

        private Writer(PDDocument document) throws IOException {
            this.document = document;
            newPage();
        }

        private void heading(String text) throws IOException {
            ensureSpace(32);
            write(text, bold, 18);
            y -= 14;
        }

        private void section(String text) throws IOException {
            ensureSpace(28);
            y -= 7;
            write(text, bold, 13);
            y -= 5;
        }

        private void paragraph(String text) throws IOException {
            for (String line : wrap(text, regular, 11, 490)) {
                ensureSpace(LINE_HEIGHT);
                write(line, regular, 11);
            }
        }

        private void write(String text, PDType1Font font, float size) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.newLineAtOffset(MARGIN, y);
            stream.showText(text);
            stream.endText();
            y -= LINE_HEIGHT;
        }

        private List<String> wrap(String text, PDType1Font font, float size, float width) throws IOException {
            String[] words = text.split("\\s+");
            java.util.ArrayList<String> lines = new java.util.ArrayList<>();
            StringBuilder line = new StringBuilder();
            for (String word : words) {
                String candidate = line.isEmpty() ? word : line + " " + word;
                if (!line.isEmpty() && font.getStringWidth(candidate) * size / 1000 > width) {
                    lines.add(line.toString());
                    line.setLength(0);
                }
                if (!line.isEmpty()) line.append(' ');
                line.append(word);
            }
            if (!line.isEmpty()) lines.add(line.toString());
            return lines;
        }

        private void ensureSpace(float needed) throws IOException {
            if (y - needed < BOTTOM_MARGIN) newPage();
        }

        private void newPage() throws IOException {
            if (stream != null) stream.close();
            page = new PDPage();
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        private void finish() throws IOException {
            if (stream != null) stream.close();
        }
    }
}
