package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "Modelo",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_modelo_usuario_corpo",
                        columnNames = {"usuario_id", "corpo_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Modelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "corpo_id", nullable = false)
    private Corpo corpo;

    @Column(nullable = false)
    private Short pontuacao;

    @Column(nullable = false)
    private LocalDateTime dataAvaliacao;
}