package com.plp.lending.event;

import com.plp.lending.config.RabbitMQConfig;
import com.plp.lending.model.entity.Loan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoanEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publishes a loan event to RabbitMQ after the current transaction commits.
     * If called outside a transaction, publishes immediately.
     */
    public void publishLoanEvent(String eventType, Loan loan) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("loanId", loan.getId().toString());
        event.put("loanNumber", loan.getLoanNumber());
        event.put("borrowerId", loan.getBorrowerId().toString());
        event.put("programId", loan.getProgramId() != null ? loan.getProgramId().toString() : null);
        event.put("anchorId", loan.getAnchorId() != null ? loan.getAnchorId().toString() : null);
        event.put("productType", loan.getProductType());
        event.put("amount", loan.getRequestedAmount() != null ? loan.getRequestedAmount().toString() : "0");
        event.put("status", loan.getStatus() != null ? loan.getStatus().name() : null);
        event.put("dueDate", loan.getDueDate() != null ? loan.getDueDate().toString() : "");
        event.put("outstanding", loan.getOutstandingAmount() != null ? loan.getOutstandingAmount().toString() : "0");

        publishAfterCommit(() -> {
            rabbitTemplate.convertAndSend(RabbitMQConfig.LOAN_EVENT_EXCHANGE, "loan." + eventType.toLowerCase(), event);
            log.info("Published loan event: {} for {}", eventType, loan.getLoanNumber());
        }, "loan event " + eventType);
    }

    public void publishAuditEvent(String entityType, String entityId, String action,
                                   String actorId, String actorRole, String oldValues, String newValues) {
        Map<String, Object> event = new HashMap<>();
        event.put("entityType", entityType);
        event.put("entityId", entityId);
        event.put("action", action);
        event.put("actorId", actorId);
        event.put("actorRole", actorRole);
        event.put("oldValues", oldValues);
        event.put("newValues", newValues);

        publishAfterCommit(() -> {
            rabbitTemplate.convertAndSend(RabbitMQConfig.AUDIT_EXCHANGE, "audit.loan", event);
            log.debug("Published audit event: {} {} {}", entityType, entityId, action);
        }, "audit event " + entityType + " " + action);
    }

    /**
     * Publishes immediately regardless of transaction state.
     * Use for compensating events that must fire even if the transaction rolls back.
     */
    public void publishLoanEventImmediate(String eventType, Loan loan) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("loanId", loan.getId().toString());
            event.put("loanNumber", loan.getLoanNumber());
            event.put("borrowerId", loan.getBorrowerId().toString());
            event.put("programId", loan.getProgramId() != null ? loan.getProgramId().toString() : null);
            event.put("anchorId", loan.getAnchorId() != null ? loan.getAnchorId().toString() : null);
            event.put("productType", loan.getProductType());
            event.put("amount", loan.getRequestedAmount() != null ? loan.getRequestedAmount().toString() : "0");
            event.put("status", loan.getStatus() != null ? loan.getStatus().name() : null);
            rabbitTemplate.convertAndSend(RabbitMQConfig.LOAN_EVENT_EXCHANGE, "loan." + eventType.toLowerCase(), event);
            log.info("Published immediate loan event: {} for {}", eventType, loan.getLoanNumber());
        } catch (Exception e) {
            log.error("CRITICAL: Failed to publish immediate {}: {}", eventType, e.getMessage());
        }
    }

    private void publishAfterCommit(Runnable publishAction, String description) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        publishAction.run();
                    } catch (Exception e) {
                        log.error("Failed to publish {}: {}", description, e.getMessage());
                    }
                }
            });
        } else {
            try {
                publishAction.run();
            } catch (Exception e) {
                log.error("Failed to publish {}: {}", description, e.getMessage());
            }
        }
    }
}
