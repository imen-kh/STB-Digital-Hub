using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/credits")]
public class CreditsController(DigiCreditService digiCreditService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCreditService.GetOverviewAsync(clientId, cancellationToken));
    }

    [HttpPost("compare")]
    public IActionResult Compare([FromBody] SimulateCreditRequest request)
    {
        if (!TryGetClientId(out _))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(digiCreditService.CompareScenarios(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulateCreditRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            var result = await digiCreditService.SimulateAsync(clientId, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("simulations")]
    public async Task<IActionResult> GetSimulations(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCreditService.GetSimulationsAsync(clientId, cancellationToken));
    }

    [HttpPost("demandes")]
    public async Task<IActionResult> SubmitDemande([FromBody] SubmitDemandeRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCreditService.SubmitDemandeAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpGet("demandes")]
    public async Task<IActionResult> GetDemandes([FromQuery] string? statut, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCreditService.GetDemandesAsync(clientId, statut, cancellationToken));
    }

    [HttpGet]
    public async Task<IActionResult> GetCredits([FromQuery] string? statut, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCreditService.GetCreditsAsync(clientId, statut, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetCredit(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var credit = await digiCreditService.GetCreditAsync(clientId, id, cancellationToken);
        return credit is null ? NotFound(new { message = "Crédit introuvable." }) : Ok(credit);
    }

    [HttpPost("{id:long}/early-repayment/simulate")]
    public async Task<IActionResult> SimulateEarlyRepayment(
        long id,
        [FromBody] EarlyRepaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (result, error) = await digiCreditService.SimulateEarlyRepaymentAsync(
            clientId, id, request.Montant, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(result);
    }

    [HttpPost("{id:long}/pay-installment")]
    public async Task<IActionResult> PayInstallment(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiCreditService.PayNextInstallmentAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpGet("{id:long}/amortization.pdf")]
    public async Task<IActionResult> DownloadAmortization(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await digiCreditService.GenerateAmortizationPdfAsync(clientId, id, cancellationToken);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return File(pdf!, "application/pdf", $"amortissement-credit-{id}.pdf");
    }

    [HttpGet("simulations/{id:long}/attestation.pdf")]
    public async Task<IActionResult> DownloadSimulationPdf(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await digiCreditService.GenerateSimulationPdfAsync(clientId, id, cancellationToken);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return File(pdf!, "application/pdf", $"simulation-credit-{id}.pdf");
    }

    [AllowAnonymous]
    [HttpGet("actions/confirm/{token:guid}")]
    public async Task<IActionResult> ConfirmAction(Guid token, CancellationToken cancellationToken)
    {
        var result = await digiCreditService.ConfirmEmailActionAsync(token, cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("actions/confirm-email/{token:guid}")]
    public async Task<IActionResult> ConfirmEmailLink(
        Guid token,
        [FromServices] EmailLinkBuilder emailLinks,
        CancellationToken cancellationToken)
    {
        var result = await digiCreditService.ConfirmEmailActionAsync(token, cancellationToken);
        var html = CardActionConfirmationService.BuildResultHtml(
            result.Success,
            result.Success ? "Confirmation réussie" : "Confirmation impossible",
            result.Message,
            null,
            emailLinks.FrontendHome());
        return Content(html, "text/html; charset=utf-8");
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
