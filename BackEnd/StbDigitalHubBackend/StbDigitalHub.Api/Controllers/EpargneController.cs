using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/epargne")]
public class EpargneController(DigiEpargneService digiEpargneService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(await digiEpargneService.GetDashboardAsync(clientId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("mouvements")]
    public async Task<IActionResult> Mouvements([FromQuery] string? type, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiEpargneService.GetMouvementsAsync(clientId, type, cancellationToken));
    }

    [HttpGet("mouvements.pdf")]
    public async Task<IActionResult> ExportPdf(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await digiEpargneService.GenerateMouvementsPdfAsync(clientId, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : File(pdf!, "application/pdf", "mouvements-epargne.pdf");
    }

    [HttpPost("versement")]
    public async Task<IActionResult> Verser([FromBody] VersementRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dash, error) = await digiEpargneService.VerserAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dash);
    }

    [HttpPost("retraits")]
    public async Task<IActionResult> DemanderRetrait([FromBody] RetraitRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await digiEpargneService.DemanderRetraitAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpGet("retraits")]
    public async Task<IActionResult> GetRetraits([FromQuery] string? statut, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiEpargneService.GetDemandesAsync(clientId, statut, cancellationToken));
    }

    [HttpPost("retraits/{id:long}/annuler")]
    public async Task<IActionResult> AnnulerRetrait(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (message, error) = await digiEpargneService.AnnulerDemandeAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new { message });
    }

    [HttpGet("arrondi")]
    public async Task<IActionResult> GetArrondi(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiEpargneService.GetArrondiAsync(clientId, cancellationToken));
    }

    [HttpPut("arrondi")]
    public async Task<IActionResult> SetArrondi([FromBody] ToggleArrondiRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiEpargneService.SetArrondiAsync(clientId, request.Active, cancellationToken));
    }

    [HttpGet("regles")]
    public async Task<IActionResult> GetRegles(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiEpargneService.GetReglesAsync(clientId, cancellationToken));
    }

    [HttpPost("regles")]
    public async Task<IActionResult> UpsertRegle([FromBody] UpsertRegleRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (regle, error) = await digiEpargneService.UpsertRegleAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(regle);
    }

    [HttpPost("regles/{id:long}/toggle")]
    public async Task<IActionResult> ToggleRegle(long id, [FromBody] ToggleRegleBody body, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (regle, error) = await digiEpargneService.ToggleRegleAsync(clientId, id, body.Active, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(regle);
    }

    [HttpPost("regles/{id:long}/executer")]
    public async Task<IActionResult> ExecuterRegle(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dash, error) = await digiEpargneService.ExecuterRegleAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dash);
    }

    [HttpPut("objectif")]
    public async Task<IActionResult> SetObjectif([FromBody] ObjectifRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dash, error) = await digiEpargneService.SetObjectifAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dash);
    }

    [HttpPost("interets")]
    public async Task<IActionResult> CrediterInterets(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dash, error) = await digiEpargneService.CrediterInteretsAsync(clientId, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dash);
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulateEpargneRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(await digiEpargneService.SimulateAsync(clientId, request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("actions/confirm/{token:guid}")]
    public async Task<IActionResult> ConfirmAction(Guid token, CancellationToken cancellationToken)
    {
        return Ok(await digiEpargneService.ConfirmEmailActionAsync(token, cancellationToken));
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}

public record ToggleRegleBody(bool Active);
