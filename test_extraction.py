import asyncio
import sys
sys.path.append('/Users/vishak/Documents/AutoProcure/backend')
from app.ai_processor import ai_processor

async def test():
    text = """Vendor A Quote
ABC Supplies
Date: 2024-01-15

Item: Office Chair - Ergonomic - $125.00 x 50 = $6,250.00
Item: Desk Lamp - LED - $45.00 x 100 = $4,500.00
Item: Printer Paper - A4 - $12.50 x 200 = $2,500.00
Item: Whiteboard - 4x6ft - $180.00 x 10 = $1,800.00
Item: Setup Fee - $500.00 x 1 = $500.00

Total: $15,550.00
Payment Terms: Net 30
Delivery: 2 weeks"""
    
    quote = await ai_processor.analyze_quote(text)
    print('Vendor:', quote.vendorName)
    print('Items count:', len(quote.items))
    for item in quote.items:
        print(f'  {item.quantity}x {item.description} @ ${item.unitPrice} = ${item.total}')

if __name__ == "__main__":
    asyncio.run(test())
