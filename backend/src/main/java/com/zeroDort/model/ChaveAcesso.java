package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Chave_acesso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChaveAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false)
    private Boolean utilizada;

    @PrePersist
    public void prePersist() {
        utilizada = false;
    }
}
