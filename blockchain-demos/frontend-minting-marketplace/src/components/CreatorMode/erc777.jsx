import {useState, useEffect, useCallback} from 'react'
import * as ethers from 'ethers'
import { useSelector } from 'react-redux';

import Swal from 'sweetalert2';

const ERC777Manager = () => {

	const [erc777Data, setERC777Data] = useState();
	const [targetAddress, setTargetAddress] = useState('');
	const [targetValue, setTargetValue] = useState(0);
	const [refetchingFlag, setRefetchingFlag] = useState(false);
	
	const { erc777Instance, currentUserAddress } = useSelector(state => state.contractStore);

	const refreshData = useCallback(async () => {
		setRefetchingFlag(true);
		setERC777Data({
			balance: (await erc777Instance.balanceOf(currentUserAddress)).toString(),
			name: await erc777Instance.name(),
			symbol: await erc777Instance.symbol(),
			decimals: await erc777Instance.decimals()
		});
		setRefetchingFlag(false);
	}, [erc777Instance, currentUserAddress]);

	useEffect(() => {
		if (currentUserAddress) {
			refreshData();
		}
	}, [refreshData, currentUserAddress])

	return <div className='col py-4 border border-white rounded' style={{position: 'relative'}}>
		<h5> ERC777 </h5>
		<small>({erc777Instance.address})</small>
		<button
			style={{position: 'absolute', left: 0, top: 0, color: 'inherit'}}
			onClick={refreshData}
			disabled={refetchingFlag}
			className='btn'>
			{refetchingFlag ? '...' : <i className='fas fa-redo' />}
		</button>
		<br />
		{erc777Data ? <>
			<br/>
			Your balance on the '{erc777Data.name}' Token: {ethers.BigNumber.from(erc777Data.balance).div(ethers.BigNumber.from(10).pow(erc777Data.decimals)).toString()} {erc777Data.symbol} <br/>
			<hr className='w-100' />
			Transfer Tokens<br/>
			Transfer to Address: <input className='form-control w-75 mx-auto' value={targetAddress} onChange={e => setTargetAddress(e.target.value)} />
			Amount to Transfer: <input className='form-control w-75 mx-auto' value={targetValue} type='number' onChange={e => setTargetValue(e.target.value)} />
			<br/>
			{targetValue !== '' && targetAddress && <button disabled={targetValue <= 0 || targetAddress === ''} onClick={async () => {
				try {
					await erc777Instance.send(targetAddress, targetValue, ethers.utils.toUtf8Bytes(''));
				} catch (err) {
					console.error('Error sending ERC777 tokens', err)
					Swal.fire('Error', err, 'error');
				}
			}} className='btn btn-royal-ice'>
				Transfer {ethers.BigNumber.from(targetValue).div(ethers.BigNumber.from(10).pow(erc777Data.decimals)).toString()} {erc777Data.symbol} to {targetAddress}!
			</button>}
			<hr className='w-100'/>
			{window.ethereum && <button className='btn btn-light' onClick={e => {
				window.ethereum.request({
					method: 'metamask_watchAsset',
					params: {
						"type":"ERC20", // Initially only supports ERC20, but eventually more!
						"options":{
							"address": erc777Instance.address, // The address that the token is at.
							"symbol": erc777Data.symbol, // A ticker symbol or shorthand, up to 5 chars.
							"decimals": 18, // The number of decimals in the token
						},
					}})
				.then(boolean => Swal.fire(boolean ? 'ERC777 RAIR Token added' : 'Failed to Add ERC777 RAIR Token'))
			}}>
				Track {erc777Data.name} Token on Metamask!
			</button>}
		</> : 'Fetching info...'}
	</div>
}

export default ERC777Manager;