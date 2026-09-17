using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/transferts")]
public class TransfertsController(DigiTransfertService transfertService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(await transfertService.GetOverviewAsync(clientId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("taux")]
    public IActionResult Taux()
    {
        if (!TryGetClientId(out _))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(transfertService.GetTauxChange());
    }

    [HttpPost("simulate")]
    public async Task<IActionResult> Simulate([FromBody] SimulateFraisRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (result, error) = await transfertService.SimulateAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(result);
    }

    [HttpGet("beneficiaires")]
    public async Task<IActionResult> GetBeneficiaires([FromQuery] bool inclusInactifs = false, CancellationToken cancellationToken = default)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await transfertService.GetBeneficiairesAsync(clientId, inclusInactifs, cancellationToken));
    }

    [HttpPost("beneficiaires")]
    public async Task<IActionResult> CreateBeneficiaire([FromBody] UpsertBeneficiaireRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dto, error) = await transfertService.CreateBeneficiaireAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dto);
    }

    [HttpPut("beneficiaires/{id:long}")]
    public async Task<IActionResult> UpdateBeneficiaire(long id, [FromBody] UpdateBeneficiaireRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dto, error) = await transfertService.UpdateBeneficiaireAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dto);
    }

    [HttpDelete("beneficiaires/{id:long}")]
    public async Task<IActionResult> DeleteBeneficiaire(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (message, error) = await transfertService.DeleteBeneficiaireAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new { message });
    }

    [HttpPost("beneficiaires/{id:long}/favori")]
    public async Task<IActionResult> ToggleFavori(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (dto, error) = await transfertService.ToggleFavoriAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> GetVirements(
        [FromQuery] string? statut,
        [FromQuery] string? q,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] long? idBeneficiaire,
        [FromQuery] decimal? min,
        [FromQuery] decimal? max,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await transfertService.GetVirementsAsync(
            clientId, statut, q, from, to, idBeneficiaire, min, max, type, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetVirement(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var dto = await transfertService.GetVirementAsync(clientId, id, cancellationToken);
        return dto is null ? NotFound(new { message = "Virement introuvable." }) : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Initier([FromBody] InitierVirementRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await transfertService.InitierAsync(clientId, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/confirm")]
    public async Task<IActionResult> Confirmer(long id, [FromBody] ConfirmerVirementRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await transfertService.ConfirmerAsync(clientId, id, request, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/resend-otp")]
    public async Task<IActionResult> ResendOtp(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (response, error) = await transfertService.ResendOtpAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(response);
    }

    [HttpPost("{id:long}/annuler")]
    public async Task<IActionResult> Annuler(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (message, error) = await transfertService.AnnulerAsync(clientId, id, cancellationToken);
        return error is not null ? BadRequest(new { message = error }) : Ok(new { message });
    }

    [HttpGet("{id:long}/recu.pdf")]
    public async Task<IActionResult> DownloadRecu(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (pdf, error) = await transfertService.GenerateRecuPdfAsync(clientId, id, cancellationToken);
        return error is not null
            ? BadRequest(new { message = error })
            : File(pdf!, "application/pdf", $"recu-virement-{id}.pdf");
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
