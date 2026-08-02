using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController(NotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        var result = await notificationService.GetForClientAsync(clientId, cancellationToken: cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        await notificationService.MarkAsReadAsync(clientId, id, cancellationToken);
        return Ok(new { message = "Notification marquée comme lue." });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        await notificationService.MarkAllAsReadAsync(clientId, cancellationToken);
        return Ok(new { message = "Toutes les notifications ont été marquées comme lues." });
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
