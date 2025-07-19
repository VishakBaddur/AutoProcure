import httpx
import os
from typing import Dict, Any
from .models import AnalysisResult

async def send_slack_alert(result: AnalysisResult, webhook_url: str = None) -> bool:
    """
    Send Slack alert with quote analysis results
    
    Args:
        result: AnalysisResult from quote processing
        webhook_url: Slack webhook URL (optional, can use env var)
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # Get webhook URL from parameter or environment
        webhook_url = webhook_url or os.getenv('SLACK_WEBHOOK_URL')
        if not webhook_url:
            print("Warning: No Slack webhook URL configured")
            return False
        
        # Calculate total cost across all vendors
        total_cost = sum(
            sum(item.total for item in quote.items) 
            for quote in result.quotes
        )
        
        # Find best vendor (lowest total cost)
        best_vendor = min(result.quotes, key=lambda q: sum(item.total for item in q.items))
        best_vendor_cost = sum(item.total for item in best_vendor.items)
        
        # Create Slack message
        message = {
            "text": "🎯 *AutoProcure Quote Analysis Complete*",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🎯 AutoProcure Quote Analysis Complete"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Total Vendors Analyzed:*\n{result.comparison['vendorCount']}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Total Quote Value:*\n${total_cost:,.2f}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*🤖 AI Recommendation:*\n{result.recommendation}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*🏆 Best Vendor:* {best_vendor.vendorName} (${best_vendor_cost:,.2f})"
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "AutoProcure AI • Quote Analysis Complete"
                        }
                    ]
                }
            ]
        }
        
        # Send to Slack
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=message)
            response.raise_for_status()
            
        print(f"✅ Slack alert sent successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send Slack alert: {str(e)}")
        return False

# Example usage:
# await send_slack_alert(analysis_result, "https://hooks.slack.com/services/YOUR/WEBHOOK/URL") 