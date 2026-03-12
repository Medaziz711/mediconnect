package com.medical.platform.repository;

import com.medical.platform.entity.DemandesInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandesInscriptionRepository extends JpaRepository<DemandesInscription, Long> {
    List<DemandesInscription> findByStatutOrderByDateDemandeDesc(DemandesInscription.StatutDemande statut);
}
