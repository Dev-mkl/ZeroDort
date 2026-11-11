package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, length = 40)
    private String nome;

    @OneToOne
    @JoinColumn(name = "chave_id", nullable = false, unique = true)
    private ChaveAcesso chaveAcesso;

    @Column(nullable = false)
    private Double score;
}
