using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public class ChatController(ChatAssistantService chatAssistant) : ControllerBase
{
    [HttpGet("welcome")]
    public async Task<IActionResult> Welcome(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        return Ok(await chatAssistant.WelcomeAsync(clientId, cancellationToken));
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] ChatAskRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(await chatAssistant.AskAsync(clientId, request.Message, request.PreviousIntent, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
