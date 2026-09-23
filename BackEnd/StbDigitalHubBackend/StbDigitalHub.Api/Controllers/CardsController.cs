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

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCarteService.GetAnalyticsAsync(clientId, cancellationToken));
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

        var (response, error) = await digiCarteService.SetOnlinePaymentsAsync(clientId, id, request.Actif, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/reveal-number")]
    public async Task<IActionResult> RevealNumber(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.RevealNumberAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPut("{id:long}/limits")]
    public async Task<IActionResult> UpdateLimits(long id, [FromBody] UpdateLimitsRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.UpdateLimitsAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPatch("{id:long}/limits/temporary")]
    public async Task<IActionResult> SetTemporaryLimit(long id, [FromBody] TemporaryLimitRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.SetTemporaryLimitAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
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

    [HttpPost("{id:long}/transactions/{transactionId:long}/confirm")]
    public async Task<IActionResult> SubmitConfirmUnusualTransaction(
        long id,
        long transactionId,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.SubmitConfirmUnusualTransactionAsync(
            clientId, id, transactionId, cancellationToken);
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

    [HttpPost("{id:long}/recharge")]
    public async Task<IActionResult> SubmitRecharge(long id, [FromBody] RechargeRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.SubmitRechargeAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
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

    [HttpPatch("{id:long}/travel/ecommerce")]
    public async Task<IActionResult> SubmitEcommerceIntl(
        long id,
        [FromBody] UpdateEcommerceIntlRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCarteService.SubmitEcommerceIntlAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
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

    [AllowAnonymous]
    [HttpGet("actions/confirm/{token:guid}")]
    public async Task<IActionResult> ConfirmEmailAction(Guid token, CancellationToken cancellationToken)
    {
        var result = await digiCarteService.ConfirmEmailActionAsync(token, cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("actions/confirm-email/{token:guid}")]
    public async Task<IActionResult> ConfirmEmailLink(
        Guid token,
        [FromQuery] string? returnUrl,
        [FromQuery] string? sig,
        [FromServices] EmailLinkBuilder emailLinks,
        CancellationToken cancellationToken)
    {
        var page = await digiCarteService.OpenEmailPageAsync(token, cancellationToken);
        if (page.ShowForm)
        {
            var html = CardActionConfirmationService.BuildDecisionHtml(
                page.Titre,
                page.Recapitulatif,
                emailLinks.CardConfirm(token),
                emailLinks.CardCancel(token),
                returnUrl ?? string.Empty,
                sig ?? string.Empty);
            return Content(html, "text/html; charset=utf-8");
        }

        return FinishEmail(token, page.Result, returnUrl, sig, emailLinks);
    }

    [AllowAnonymous]
    [HttpPost("actions/confirm-email/{token:guid}")]
    public async Task<IActionResult> ConfirmEmailPost(
        Guid token,
        [FromForm] string? returnUrl,
        [FromForm] string? sig,
        [FromServices] EmailLinkBuilder emailLinks,
        CancellationToken cancellationToken)
    {
        var result = await digiCarteService.ConfirmEmailActionAsync(token, cancellationToken);
        return FinishEmail(token, result, returnUrl, sig, emailLinks);
    }

    [AllowAnonymous]
    [HttpPost("actions/cancel-email/{token:guid}")]
    public async Task<IActionResult> CancelEmailPost(
        Guid token,
        [FromForm] string? returnUrl,
        [FromForm] string? sig,
        [FromServices] EmailLinkBuilder emailLinks,
        CancellationToken cancellationToken)
    {
        var result = await digiCarteService.CancelEmailActionAsync(token, cancellationToken);
        return FinishEmail(token, result, returnUrl, sig, emailLinks);
    }

    private IActionResult FinishEmail(
        Guid token,
        CardActionConfirmResult result,
        string? returnUrl,
        string? sig,
        EmailLinkBuilder emailLinks)
    {
        if (!string.IsNullOrWhiteSpace(result.NumeroComplet))
        {
            return Content(ResultHtml(result, emailLinks), "text/html; charset=utf-8");
        }

        var target = emailLinks.IsValidReturn(token, returnUrl, sig)
            ? returnUrl
            : emailLinks.CardPage(result.CardId);
        if (!string.IsNullOrWhiteSpace(target))
        {
            return Redirect(EmailLinkBuilder.WithResult(target, result.Success, result.Message));
        }

        return Content(ResultHtml(result, emailLinks), "text/html; charset=utf-8");
    }

    private static string ResultHtml(CardActionConfirmResult result, EmailLinkBuilder emailLinks)
    {
        var title = result.Success ? "Confirmation réussie" : "Demande traitée";
        return CardActionConfirmationService.BuildResultHtml(
            result.Success,
            title,
            result.Message,
            result.NumeroComplet,
            emailLinks.FrontendHome());
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
