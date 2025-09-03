import asyncio
from app.ai_processor import ai_processor

async def test():
    sample_text = 'Vendor: ABC Supplies\nItem: Office Chair\nQuantity: 10\nUnit Price: $50\nTotal: $500'
    print(f"Testing with text: {sample_text}")
    
    try:
        result = await ai_processor.analyze_quote(sample_text)
        print(f'Vendor: {result.vendorName}')
        print(f'Items found: {len(result.items)}')
        for item in result.items:
            print(f'- {item.description}: {item.quantity} x ${item.unitPrice} = ${item.total}')
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
