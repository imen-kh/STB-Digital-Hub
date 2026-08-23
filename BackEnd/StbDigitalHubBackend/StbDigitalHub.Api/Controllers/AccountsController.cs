using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/accounts")]
public class AccountsController(DigiCompteService digiCompteService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAccounts([FromQuery] string? type, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var accounts = await digiCompteService.GetAccountsAsync(clientId, type, cancellationToken);
        return Ok(accounts);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await digiCompteService.GetAnalyticsAsync(clientId, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetAccount(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var account = await digiCompteService.GetAccountAsync(clientId, id, cancellationToken);
        return account is null ? NotFound(new { message = "Compte introuvable." }) : Ok(account);
    }

    [HttpGet("{id:long}/transactions")]
    public async Task<IActionResult> GetTransactions(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var transactions = await digiCompteService.GetTransactionsAsync(clientId, id, cancellationToken);
        return Ok(transactions);
    }

    [HttpPost("{id:long}/transfer")]
    public async Task<IActionResult> Transfer(
        long id,
        [FromBody] TransferRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var (source, destination, error) = await digiCompteService.TransferAsync(clientId, id, request, cancellationToken);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return Ok(new
        {
            message = "Virement effectué avec succès.",
            source,
            destination
        });
    }

    private bool TryGetClientId(out long clientId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(raw, out clientId);
    }
}
