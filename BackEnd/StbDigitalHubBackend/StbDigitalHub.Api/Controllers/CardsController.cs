using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/cards")]
public class CardsController(DigiCarteService digiCarteService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCards([FromQuery] string? statut, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        StatutCarte? filter = null;
        if (!string.IsNullOrWhiteSpace(statut) && Enum.TryParse<StatutCarte>(statut, true, out var parsed))
        {
            filter = parsed;
        }

        var cards = await digiCarteService.GetCardsAsync(clientId, filter, cancellationToken);
        return Ok(cards);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetCard(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var card = await digiCarteService.GetCardAsync(clientId, id, cancellationToken);
        return card is null ? NotFound(new { message = "Carte introuvable." }) : Ok(card);
    }

    [HttpPatch("{id:long}/block")]
    public async Task<IActionResult> Block(long id, [FromBody] ConfirmActionRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.BlockAsync(clientId, id, request.Confirm, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new CardActionResponse("Carte bloquée avec succès.", card!));
    }

    [HttpPatch("{id:long}/unblock")]
    public async Task<IActionResult> Unblock(long id, [FromBody] ConfirmActionRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.UnblockAsync(clientId, id, request.Confirm, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new CardActionResponse("Carte débloquée avec succès.", card!));
    }

    [HttpPatch("{id:long}/online-payments")]
    public async Task<IActionResult> SetOnlinePayments(long id, [FromBody] UpdateOnlinePaymentsRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.SetOnlinePaymentsAsync(clientId, id, request.Actif, request.Confirm, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new CardActionResponse("Paiements en ligne mis à jour.", card!));
    }

    [HttpPost("{id:long}/limits/request-otp")]
    public async Task<IActionResult> RequestLimitsOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestLimitsOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/limits/temporary/request-otp")]
    public async Task<IActionResult> RequestTemporaryLimitOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestTemporaryLimitOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/reveal-number/request-otp")]
    public async Task<IActionResult> RequestRevealNumberOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestRevealNumberOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/reveal-number")]
    public async Task<IActionResult> RevealNumber(long id, [FromBody] CardOtpVerifyRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RevealNumberAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPut("{id:long}/limits")]
    public async Task<IActionResult> UpdateLimits(long id, [FromBody] UpdateLimitsRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.UpdateLimitsAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new CardActionResponse("Plafonds mis à jour.", card!));
    }

    [HttpPatch("{id:long}/limits/temporary")]
    public async Task<IActionResult> SetTemporaryLimit(long id, [FromBody] TemporaryLimitRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.SetTemporaryLimitAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new CardActionResponse("Plafond temporaire appliqué.", card!));
    }

    [HttpGet("{id:long}/transactions")]
    public async Task<IActionResult> GetTransactions(
        long id,
        [FromQuery] string? type,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        TypeOperation? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<TypeOperation>(type, true, out var parsed))
        {
            typeFilter = parsed;
        }

        var transactions = await digiCarteService.GetTransactionsAsync(clientId, id, typeFilter, from, to, cancellationToken);
        return Ok(transactions);
    }

    [HttpPost("{id:long}/transactions/fake")]
    public async Task<IActionResult> GenerateFakeTransaction(
        long id,
        [FromBody] FakeTransactionRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (transaction, error) = await digiCarteService.GenerateFakeTransactionAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(transaction);
    }

    [HttpPost("{id:long}/transactions/{transactionId:long}/confirm/request-otp")]
    public async Task<IActionResult> RequestConfirmPendingTransactionOtp(
        long id,
        long transactionId,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestConfirmPendingTransactionOtpAsync(
            clientId, id, transactionId, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/transactions/{transactionId:long}/confirm")]
    public async Task<IActionResult> ConfirmPendingTransaction(
        long id,
        long transactionId,
        [FromBody] ConfirmPendingTransactionRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.ConfirmPendingTransactionAsync(
            clientId, id, transactionId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/transactions/{transactionId:long}/refuse")]
    public async Task<IActionResult> RefusePendingTransaction(
        long id,
        long transactionId,
        [FromBody] ConfirmActionRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RefusePendingTransactionAsync(
            clientId, id, transactionId, request.Confirm, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/recharge/request-otp")]
    public async Task<IActionResult> RequestRechargeOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestRechargeOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/recharge")]
    public async Task<IActionResult> Recharge(long id, [FromBody] RechargeRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (transaction, card, error) = await digiCarteService.RechargeAsync(clientId, id, request, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : Ok(new { message = "Recharge effectuée.", transaction, card });
    }

    [HttpGet("{id:long}/statement")]
    public async Task<IActionResult> DownloadStatement(
        long id,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await digiCarteService.GenerateStatementAsync(clientId, id, from, to, cancellationToken);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return File(pdf!, "application/pdf", $"releve-carte-{id}-{from:yyyyMMdd}-{to:yyyyMMdd}.pdf");
    }

    [HttpGet("{id:long}/travel/assistance")]
    public async Task<IActionResult> GetTravelAssistance(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var card = await digiCarteService.GetCardAsync(clientId, id, cancellationToken);
        if (card is null)
        {
            return NotFound(new { message = "Carte introuvable." });
        }

        if (!card.EstTravel)
        {
            return BadRequest(new { message = "Réservé à la carte STB Travel." });
        }

        return Ok(digiCarteService.GetTravelAssistanceInfo());
    }

    [HttpGet("{id:long}/travel/assistance-certificate")]
    public async Task<IActionResult> DownloadAssistanceCertificate(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await digiCarteService.GenerateAssistanceCertificateAsync(clientId, id, cancellationToken);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return File(pdf!, "application/pdf", $"attestation-assistance-travel-{id}.pdf");
    }

    [HttpPost("{id:long}/travel/ecommerce/request-otp")]
    public async Task<IActionResult> RequestEcommerceIntlOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RequestEcommerceIntlOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPatch("{id:long}/travel/ecommerce")]
    public async Task<IActionResult> SetEcommerceIntl(
        long id,
        [FromBody] UpdateEcommerceIntlRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.SetEcommerceInternationalAsync(clientId, id, request, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : Ok(new CardActionResponse("E-commerce international mis à jour.", card!));
    }

    [HttpPatch("{id:long}/travel/marte-alerts")]
    public async Task<IActionResult> SetMarteAlerts(
        long id,
        [FromBody] UpdateMarteAlertsRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.SetMarteAlertsAsync(clientId, id, request, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : Ok(new CardActionResponse(
                request.Actif ? "Alertes Marte activées." : "Alertes Marte désactivées.",
                card!));
    }

    [HttpPatch("{id:long}/travel/preferred-currency")]
    public async Task<IActionResult> SetPreferredCurrency(
        long id,
        [FromBody] UpdatePreferredCurrencyRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (card, error) = await digiCarteService.SetPreferredCurrencyAsync(clientId, id, request, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : Ok(new CardActionResponse("Devise préférée mise à jour.", card!));
    }

    [HttpPost("{id:long}/travel/detaxe")]
    public async Task<IActionResult> CreditDetaxe(
        long id,
        [FromBody] DetaxeCreditRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (transaction, card, error) = await digiCarteService.CreditDetaxeAsync(clientId, id, request, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : Ok(new { message = "Crédit détaxe enregistré sur la carte.", transaction, card });
    }

    [HttpGet("{id:long}/travel/advantages")]
    public async Task<IActionResult> GetTravelAdvantages(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var card = await digiCarteService.GetCardAsync(clientId, id, cancellationToken);
        if (card is null)
        {
            return NotFound(new { message = "Carte introuvable." });
        }

        if (!card.EstTravel)
        {
            return BadRequest(new { message = "Réservé à la carte STB Travel." });
        }

        return Ok(digiCarteService.GetTravelAdvantages());
    }

    [HttpGet("{id:long}/travel/atms")]
    public async Task<IActionResult> GetTravelAtms(long id, [FromQuery] string? pays, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var card = await digiCarteService.GetCardAsync(clientId, id, cancellationToken);
        if (card is null)
        {
            return NotFound(new { message = "Carte introuvable." });
        }

        if (!card.EstTravel)
        {
            return BadRequest(new { message = "Réservé à la carte STB Travel." });
        }

        return Ok(digiCarteService.GetTravelAtms(pays));
    }

    [HttpGet("travel/exchange-rates")]
    public IActionResult GetExchangeRates()
    {
        if (!TryGetClientId(out _))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(digiCarteService.GetExchangeRates());
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
